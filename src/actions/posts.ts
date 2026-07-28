"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAdministrator } from "@/lib/auth/session";
import { get, run, transaction } from "@/lib/db";
import { renderMarkdownToHtml } from "@/lib/markdown/render-post-html";
import { bulkManagePostRecords } from "@/lib/posts/admin-service";
import { refreshSearchCache } from "@/lib/search-cache";
import { postSchema } from "@/lib/validation/post";

function parsePublishedAt(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return undefined;
  const timestamp = new Date(`${text}:00+08:00`).getTime();
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function parsePostForm(formData: FormData) {
  const requestedStatus = formData.get("status");
  const visibility = formData.get("visibility");
  const title = String(formData.get("title") ?? "").trim();
  const normalizeSlug = (value: string) => value
    .trim()
    .toLocaleLowerCase()
    .replace(/[\s_]+/gu, "-")
    .replace(/[^\p{L}\p{N}-]+/gu, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  const slug = normalizeSlug(String(formData.get("slug") ?? "")) || normalizeSlug(title);
  const status = requestedStatus === "draft"
    ? "draft"
    : (["hidden", "private", "waiting"].includes(String(visibility)) ? visibility : "published");

  return postSchema.parse({
    title,
    slug,
    excerpt: formData.get("excerpt") || undefined,
    coverImage: formData.get("coverImage") || undefined,
    content: formData.get("content"),
    status,
    allowComment: formData.get("allowComment") === "1",
    publishedAt: parsePublishedAt(formData.get("publishedAt")),
    categoryId: formData.get("categoryId") || undefined,
    tagIds: formData.getAll("tagIds"),
    newTagNames: formData.getAll("newTagNames"),
  });
}

function resolvePostTagIds(tagIds: string[], newTagNames: string[], now: number) {
  const resolvedIds = new Set(tagIds);
  const uniqueNames = [...new Set(newTagNames.map((name) => name.trim()).filter(Boolean))];

  for (const name of uniqueNames) {
    const existing = get<{ id: string }>(
      "SELECT id FROM tags WHERE name = ? COLLATE NOCASE LIMIT 1",
      name,
    );
    if (existing) {
      resolvedIds.add(existing.id);
      continue;
    }

    const id = randomUUID();
    run(
      "INSERT INTO tags (id, name, slug, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
      id,
      name,
      `tag-${id.slice(0, 12)}`,
      now,
      now,
    );
    resolvedIds.add(id);
  }

  return [...resolvedIds];
}

function refreshContentPages() {
  refreshSearchCache();
  // Server Action 修改数据库后，显式让相关 Server Component 重新获取数据。
  revalidatePath("/", "layout");
  revalidatePath("/admin/posts");
  revalidatePath("/admin/tags");
}

const bulkPostSchema = z.object({
  postIds: z.array(z.string().min(1).max(200)).min(1).max(100),
  operation: z.enum(["delete", "published", "waiting", "hidden", "private"]),
  returnTo: z.string().max(1000),
});

function getPostsReturnUrl(returnTo: string, notice: string) {
  const target = new URL(returnTo, "http://next-typecho.local");
  if (target.pathname !== "/admin/posts") target.href = "http://next-typecho.local/admin/posts";
  target.searchParams.set("notice", notice);
  return `${target.pathname}${target.search}`;
}

export async function createPost(formData: FormData) {
  await requireAdministrator("/admin/posts/new");
  const input = parsePostForm(formData);
  const id = randomUUID();
  const now = Date.now();
  const renderedContent = await renderMarkdownToHtml(input.content);
  const publishedAt = ["published", "hidden", "private"].includes(input.status)
    ? (input.publishedAt ?? now)
    : null;

  transaction(() => {
    run(
      `INSERT INTO posts
       (id, title, slug, excerpt, cover_image, content, rendered_content, rendered_content_updated_at, status, allow_comment, published_at, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, input.title, input.slug, input.excerpt ?? null, input.coverImage ?? null, input.content, renderedContent, now, input.status,
      input.allowComment ? 1 : 0,
      publishedAt,
      input.categoryId ?? null, now, now,
    );
    const tagIds = resolvePostTagIds(input.tagIds, input.newTagNames, now);
    for (const tagId of tagIds) {
      run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", id, tagId);
    }
  });

  refreshContentPages();
  redirect("/admin/posts");
}

export async function updatePost(postId: string, formData: FormData) {
  await requireAdministrator(`/admin/posts/${postId}/edit`);
  const input = parsePostForm(formData);
  const current = get<{ publishedAt: number | null }>(
    "SELECT published_at AS publishedAt FROM posts WHERE id = ?",
    postId,
  );
  if (!current) throw new Error("文章不存在");
  const now = Date.now();
  const renderedContent = await renderMarkdownToHtml(input.content);
  const publishedAt = ["published", "hidden", "private"].includes(input.status)
    ? (input.publishedAt ?? current.publishedAt ?? now)
    : null;

  transaction(() => {
    run(
      `UPDATE posts SET title = ?, slug = ?, excerpt = ?, cover_image = ?, content = ?, rendered_content = ?, rendered_content_updated_at = ?,
       status = ?, allow_comment = ?, published_at = ?, category_id = ?, updated_at = ? WHERE id = ?`,
      input.title, input.slug, input.excerpt ?? null, input.coverImage ?? null, input.content, renderedContent, now,
      input.status,
      input.allowComment ? 1 : 0,
      publishedAt,
      input.categoryId ?? null, now, postId,
    );
    run("DELETE FROM posts_to_tags WHERE post_id = ?", postId);
    const tagIds = resolvePostTagIds(input.tagIds, input.newTagNames, now);
    for (const tagId of tagIds) {
      run("INSERT INTO posts_to_tags (post_id, tag_id) VALUES (?, ?)", postId, tagId);
    }
  });

  refreshContentPages();
  redirect("/admin/posts");
}

export async function bulkManagePosts(formData: FormData) {
  await requireAdministrator("/admin/posts");
  const returnTo = String(formData.get("returnTo") ?? "/admin/posts");
  const parsed = bulkPostSchema.safeParse({
    postIds: formData.getAll("postIds").map(String),
    operation: formData.get("operation"),
    returnTo,
  });
  if (!parsed.success) redirect(getPostsReturnUrl(returnTo, "请选择要操作的文章"));

  const { postIds, operation } = parsed.data;
  bulkManagePostRecords(postIds, operation);

  refreshContentPages();
  const verb = operation === "delete" ? "删除" : "更新";
  redirect(getPostsReturnUrl(returnTo, `文章已经${verb}`));
}

export async function deletePost(postId: string) {
  await requireAdministrator("/admin/posts");
  run("DELETE FROM posts WHERE id = ?", postId);
  refreshContentPages();
}

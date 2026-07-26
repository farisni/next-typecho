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

function parsePostForm(formData: FormData) {
  const requestedStatus = formData.get("status");
  const visibility = formData.get("visibility");
  const status = requestedStatus === "draft"
    ? "draft"
    : (["hidden", "private", "waiting"].includes(String(visibility)) ? visibility : "published");

  return postSchema.parse({
    title: formData.get("title"),
    slug: formData.get("slug"),
    excerpt: formData.get("excerpt") || undefined,
    content: formData.get("content"),
    status,
    allowComment: formData.get("allowComment") === "1",
    categoryId: formData.get("categoryId") || undefined,
    tagIds: formData.getAll("tagIds"),
  });
}

function refreshContentPages() {
  refreshSearchCache();
  // Server Action 修改数据库后，显式让相关 Server Component 重新获取数据。
  revalidatePath("/", "layout");
  revalidatePath("/admin/posts");
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
  const renderedContent = renderMarkdownToHtml(input.content);

  transaction(() => {
    run(
      `INSERT INTO posts
       (id, title, slug, excerpt, content, rendered_content, rendered_content_updated_at, status, allow_comment, published_at, category_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id, input.title, input.slug, input.excerpt ?? null, input.content, renderedContent, now, input.status,
      input.allowComment ? 1 : 0,
      ["published", "hidden", "private"].includes(input.status) ? now : null,
      input.categoryId ?? null, now, now,
    );
    for (const tagId of input.tagIds) {
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
  const renderedContent = renderMarkdownToHtml(input.content);

  transaction(() => {
    run(
      `UPDATE posts SET title = ?, slug = ?, excerpt = ?, content = ?, rendered_content = ?, rendered_content_updated_at = ?,
       status = ?, allow_comment = ?, published_at = ?, category_id = ?, updated_at = ? WHERE id = ?`,
      input.title, input.slug, input.excerpt ?? null, input.content, renderedContent, now,
      input.status,
      input.allowComment ? 1 : 0,
      ["published", "hidden", "private"].includes(input.status) ? (current.publishedAt ?? now) : null,
      input.categoryId ?? null, now, postId,
    );
    run("DELETE FROM posts_to_tags WHERE post_id = ?", postId);
    for (const tagId of input.tagIds) {
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

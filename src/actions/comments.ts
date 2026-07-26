"use server";

import { randomUUID } from "node:crypto";
import { headers, cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getCurrentUser, requireAdministrator } from "@/lib/auth/session";
import { get, run, transaction } from "@/lib/db";
import { getCommentSettings } from "@/lib/repositories/settings";
import {
  adminCommentEditSchema,
  adminCommentReplySchema,
  publicCommentSchema,
} from "@/lib/validation/comments";

export type CommentActionState = {
  ok: boolean;
  message: string;
  status?: "approved" | "waiting";
  revision?: number;
};

const initialError: CommentActionState = { ok: false, message: "评论提交失败" };
const COOKIE_MAX_AGE = 30 * 24 * 60 * 60;

function normalizeUrl(value: string) {
  if (!value) return "";
  const candidate = /^[a-z][a-z\d+.-]*:/i.test(value) ? value : `https://${value}`;
  const url = new URL(candidate);
  if (!["http:", "https:"].includes(url.protocol)) throw new Error("个人主页地址格式错误");
  return url.toString();
}

function requestIp(requestHeaders: Headers) {
  return (
    requestHeaders.get("cf-connecting-ip") ??
    requestHeaders.get("x-real-ip") ??
    requestHeaders.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    ""
  ).slice(0, 64);
}

function getCommentThreadRoot(commentId: string) {
  return get<{ id: string }>(
    `WITH RECURSIVE ancestors(id, parent_id, depth) AS (
       SELECT id, parent_id, 0 FROM comments WHERE id = ?
       UNION ALL
       SELECT comments.id, comments.parent_id, ancestors.depth + 1
       FROM comments JOIN ancestors ON comments.id = ancestors.parent_id
     )
     SELECT id FROM ancestors ORDER BY depth DESC LIMIT 1`,
    commentId,
  );
}

function formError(error: unknown): CommentActionState {
  if (error instanceof z.ZodError) {
    return { ok: false, message: error.issues[0]?.message ?? initialError.message };
  }
  return { ok: false, message: error instanceof Error ? error.message : initialError.message };
}

export async function submitComment(
  _previousState: CommentActionState,
  formData: FormData,
): Promise<CommentActionState> {
  try {
    const input = publicCommentSchema.parse({
      postId: formData.get("postId"),
      postSlug: formData.get("postSlug"),
      parentId: formData.get("parentId") || undefined,
      author: formData.get("author") || "管理员",
      mail: formData.get("mail") || "",
      url: formData.get("url") || "",
      text: formData.get("text"),
      company: formData.get("company") || undefined,
    });
    const settings = getCommentSettings();
    const post = get<{
      id: string;
      slug: string;
      status: string;
      allowComment: number;
      publishedAt: number | null;
    }>(
      `SELECT id, slug, status, allow_comment AS allowComment,
              published_at AS publishedAt
       FROM posts WHERE id = ? AND slug = ? LIMIT 1`,
      input.postId,
      input.postSlug,
    );
    if (!post || post.status !== "published") throw new Error("文章不存在");
    if (!post.allowComment) throw new Error("此文章的评论已经关闭");
    if (
      settings.commentsAutoCloseDays > 0 &&
      post.publishedAt &&
      Date.now() - post.publishedAt > settings.commentsAutoCloseDays * 86400000
    ) {
      throw new Error("此文章的评论已经关闭");
    }

    const requestHeaders = await headers();
    if (settings.commentsCheckReferer) {
      const referer = requestHeaders.get("referer");
      if (!referer || new URL(referer).pathname.replace(/\/$/, "") !== `/posts/${post.slug}`) {
        throw new Error("评论来源页错误");
      }
    }
    if (settings.commentsAntiSpam && input.company) throw new Error("评论提交失败");

    const currentUser = await getCurrentUser();
    const ip = requestIp(requestHeaders);
    if (!currentUser && settings.commentsPostInterval > 0 && ip) {
      const latest = get<{ createdAt: number }>(
        `SELECT created_at AS createdAt FROM comments
         WHERE post_id = ? AND ip = ? ORDER BY created_at DESC LIMIT 1`,
        post.id,
        ip,
      );
      if (latest && Date.now() - latest.createdAt < settings.commentsPostInterval * 1000) {
        throw new Error("您的发言过于频繁，请稍候再次发布");
      }
    }

    let parentId: string | null = null;
    let replyToId: string | null = null;
    if (input.parentId) {
      if (!settings.commentsThreaded) throw new Error("评论回复功能未开启");
      const parent = get<{ id: string }>(
        "SELECT id FROM comments WHERE id = ? AND post_id = ? AND status = 'approved'",
        input.parentId,
        post.id,
      );
      if (!parent) throw new Error("父级评论不存在");
      const threadRoot = getCommentThreadRoot(parent.id);
      if (!threadRoot) throw new Error("父级评论不存在");
      parentId = threadRoot.id;
      replyToId = parent.id;
    }

    let author = input.author;
    let mail = input.mail;
    let url = normalizeUrl(input.url);
    let authorId: string | null = null;
    if (currentUser) {
      const admin = get<{ displayName: string; email: string; url: string }>(
        "SELECT display_name AS displayName, email, url FROM users WHERE id = ?",
        currentUser.id,
      );
      if (!admin) throw new Error("登录用户不存在");
      author = admin.displayName;
      mail = admin.email;
      url = admin.url;
      authorId = currentUser.id;
    } else {
      if (settings.commentsRequireMail && !mail) throw new Error("必须填写电子邮箱地址");
      if (mail && !z.string().email().safeParse(mail).success) throw new Error("邮箱地址不合法");
      if (settings.commentsRequireUrl && !url) throw new Error("必须填写个人主页");
      const protectedName = get<{ id: string }>(
        `SELECT id FROM users
         WHERE username = ? COLLATE NOCASE OR display_name = ? COLLATE NOCASE LIMIT 1`,
        author,
        author,
      );
      if (protectedName) throw new Error("该称呼已被注册，请登录后再次提交");
    }

    let status: "approved" | "waiting" = "approved";
    if (!currentUser && settings.commentsRequireModeration) {
      status = "waiting";
    } else if (!currentUser && settings.commentsWhitelist) {
      const approvedBefore = get<{ id: string }>(
        `SELECT id FROM comments
         WHERE author = ? AND mail = ? AND status = 'approved' LIMIT 1`,
        author,
        mail,
      );
      status = approvedBefore ? "approved" : "waiting";
    }

    const id = randomUUID();
    const now = Date.now();
    run(
      `INSERT INTO comments
       (id, post_id, parent_id, reply_to_id, author_id, author, mail, url, ip, agent, text,
        status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      post.id,
      parentId,
      replyToId,
      authorId,
      author,
      mail,
      url,
      ip,
      (requestHeaders.get("user-agent") ?? "").slice(0, 511),
      input.text,
      status,
      now,
      now,
    );

    const cookieStore = await cookies();
    const cookieOptions = {
      maxAge: COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax" as const,
      secure: process.env.NODE_ENV === "production",
    };
    if (!currentUser) {
      cookieStore.set("__typecho_remember_author", author, cookieOptions);
      cookieStore.set("__typecho_remember_mail", mail, cookieOptions);
      cookieStore.set("__typecho_remember_url", url, cookieOptions);
    }
    if (status === "waiting") {
      cookieStore.set("__typecho_unapproved_comment", id, cookieOptions);
    }

    revalidatePath(`/posts/${post.slug}`);
    revalidatePath("/", "layout");
    revalidatePath("/admin/comments");
    return {
      ok: true,
      status,
      revision: now,
      message: status === "approved" ? "评论已发布" : "评论已提交，正在等待审核",
    };
  } catch (error) {
    return formError(error);
  }
}

const bulkSchema = z.object({
  commentIds: z.array(z.string().uuid()).min(1).max(100),
  operation: z.enum(["approved", "waiting", "spam", "delete"]),
  returnTo: z.string().max(1000),
});

function commentsReturnUrl(value: string, notice: string) {
  const target = new URL(value, "http://next-typecho.local");
  if (target.pathname !== "/admin/comments") target.href = "http://next-typecho.local/admin/comments";
  target.searchParams.set("notice", notice);
  return `${target.pathname}${target.search}`;
}

function refreshManagedComments() {
  revalidatePath("/", "layout");
  revalidatePath("/admin/comments");
}

export async function bulkManageComments(formData: FormData) {
  await requireAdministrator("/admin/comments");
  const returnTo = String(formData.get("returnTo") ?? "/admin/comments");
  const parsed = bulkSchema.safeParse({
    commentIds: formData.getAll("commentIds").map(String),
    operation: formData.get("operation"),
    returnTo,
  });
  if (!parsed.success) redirect(commentsReturnUrl(returnTo, "请选择要操作的评论"));

  transaction(() => {
    for (const id of parsed.data.commentIds) {
      if (parsed.data.operation === "delete") run("DELETE FROM comments WHERE id = ?", id);
      else run(
        "UPDATE comments SET status = ?, updated_at = ? WHERE id = ?",
        parsed.data.operation,
        Date.now(),
        id,
      );
    }
  });
  refreshManagedComments();
  redirect(commentsReturnUrl(returnTo, "评论已经更新"));
}

export async function editComment(commentId: string, formData: FormData) {
  await requireAdministrator("/admin/comments");
  const input = adminCommentEditSchema.parse({
    author: formData.get("author"),
    mail: formData.get("mail"),
    url: formData.get("url"),
    text: formData.get("text"),
  });
  const returnTo = String(formData.get("returnTo") ?? "/admin/comments");
  run(
    `UPDATE comments SET author = ?, mail = ?, url = ?, text = ?, updated_at = ?
     WHERE id = ?`,
    input.author,
    input.mail,
    normalizeUrl(input.url),
    input.text,
    Date.now(),
    commentId,
  );
  refreshManagedComments();
  redirect(commentsReturnUrl(returnTo, "评论已经编辑"));
}

export async function replyComment(commentId: string, formData: FormData) {
  const user = await requireAdministrator("/admin/comments");
  const input = adminCommentReplySchema.parse({ text: formData.get("text") });
  const target = get<{ id: string; postId: string }>(
    "SELECT id, post_id AS postId FROM comments WHERE id = ?",
    commentId,
  );
  if (!target) throw new Error("评论不存在");
  const threadRoot = getCommentThreadRoot(target.id);
  if (!threadRoot) throw new Error("评论线程不存在");
  const admin = get<{ displayName: string; email: string; url: string }>(
    "SELECT display_name AS displayName, email, url FROM users WHERE id = ?",
    user.id,
  );
  if (!admin) throw new Error("登录用户不存在");
  const now = Date.now();
  run(
    `INSERT INTO comments
     (id, post_id, parent_id, reply_to_id, author_id, author, mail, url, ip, agent, text,
      status, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', '', ?, 'approved', ?, ?)`,
    randomUUID(),
    target.postId,
    threadRoot.id,
    target.id,
    user.id,
    admin.displayName,
    admin.email,
    admin.url,
    input.text,
    now,
    now,
  );
  refreshManagedComments();
  const returnTo = String(formData.get("returnTo") ?? "/admin/comments");
  redirect(commentsReturnUrl(returnTo, "回复已经发布"));
}

export async function deleteAllSpamComments(formData: FormData) {
  await requireAdministrator("/admin/comments");
  run("DELETE FROM comments WHERE status = 'spam'");
  refreshManagedComments();
  redirect(commentsReturnUrl(String(formData.get("returnTo") ?? "/admin/comments"), "垃圾评论已清空"));
}

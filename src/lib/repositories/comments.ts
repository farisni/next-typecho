import { createHash } from "node:crypto";
import type { SQLInputValue } from "node:sqlite";
import { all, get } from "@/lib/db";
import { getCommentSettings } from "@/lib/repositories/settings";

export type CommentStatus = "approved" | "waiting" | "spam";

export type PublicComment = {
  id: string;
  parentId: string | null;
  replyToAuthor: string | null;
  author: string;
  url: string;
  text: string;
  status: CommentStatus;
  createdLabel: string;
  avatarUrl: string;
  isOwner: boolean;
  children: PublicComment[];
};

export type LatestComment = {
  id: string;
  author: string;
  text: string;
  postTitle: string;
  postSlug: string;
  createdLabel: string;
};

type RawComment = {
  id: string;
  postId: string;
  parentId: string | null;
  replyToAuthor: string | null;
  authorId: string | null;
  author: string;
  mail: string;
  url: string;
  text: string;
  status: CommentStatus;
  createdAt: number;
};

function formatCommentDate(value: number) {
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Shanghai",
  }).format(new Date(value));
}

function gravatarUrl(mail: string) {
  const hash = createHash("md5").update(mail.trim().toLowerCase()).digest("hex");
  return `https://www.gravatar.com/avatar/${hash}?s=96&d=identicon&r=g`;
}

function hydrateComment(row: RawComment): PublicComment {
  return {
    id: row.id,
    parentId: row.parentId,
    replyToAuthor: row.replyToAuthor,
    author: row.author,
    url: row.url,
    text: row.text,
    status: row.status,
    createdLabel: formatCommentDate(row.createdAt),
    avatarUrl: row.authorId ? "/images/avatar.png" : gravatarUrl(row.mail),
    isOwner: Boolean(row.authorId),
    children: [],
  };
}

export function listLatestComments(limit = 5): LatestComment[] {
  const safeLimit = Math.min(Math.max(1, Math.trunc(limit)), 20);
  return all<{
    id: string;
    author: string;
    text: string;
    postTitle: string;
    postSlug: string;
    createdAt: number;
  }>(
    `SELECT cm.id, cm.author, cm.text, cm.created_at AS createdAt,
            p.title AS postTitle, p.slug AS postSlug
     FROM comments cm
     JOIN posts p ON p.id = cm.post_id
     WHERE cm.status = 'approved'
       AND p.status = 'published'
       AND p.published_at <= ?
     ORDER BY cm.created_at DESC
     LIMIT ?`,
    Date.now(),
    safeLimit,
  ).map((comment) => ({
    ...comment,
    createdLabel: formatCommentDate(comment.createdAt),
  }));
}

function sortCommentTree(comments: PublicComment[], direction: "ASC" | "DESC") {
  if (direction === "DESC") comments.reverse();
  for (const comment of comments) sortCommentTree(comment.children, direction);
}

export function listCommentsForPost(
  postId: string,
  requestedPage: number | undefined,
  pendingCommentId?: string,
) {
  const settings = getCommentSettings();
  const rows = all<RawComment>(
    `SELECT cm.id, cm.post_id AS postId, cm.parent_id AS parentId,
            cm.author_id AS authorId, cm.author, cm.mail, cm.url, cm.text,
            cm.status, cm.created_at AS createdAt,
            target.author AS replyToAuthor
     FROM comments cm
     LEFT JOIN comments target ON target.id = cm.reply_to_id
     WHERE cm.post_id = ? AND (cm.status = 'approved' OR cm.id = ?)
     ORDER BY cm.created_at ASC`,
    postId,
    pendingCommentId ?? "",
  );
  const comments = rows.map(hydrateComment);
  const byId = new Map(comments.map((comment) => [comment.id, comment]));
  const roots: PublicComment[] = [];

  for (const comment of comments) {
    let parent = settings.commentsThreaded && comment.parentId
      ? byId.get(comment.parentId)
      : undefined;
    if (parent) {
      while (parent.parentId) {
        const ancestor = byId.get(parent.parentId);
        if (!ancestor) break;
        parent = ancestor;
      }
      parent.children.push(comment);
    } else {
      roots.push(comment);
    }
  }

  sortCommentTree(roots, settings.commentsOrder);
  const approvedCount = rows.filter((row) => row.status === "approved").length;
  const approvedRootCount = roots.filter((comment) => comment.status === "approved").length;
  const totalPages = Math.max(1, Math.ceil(approvedRootCount / settings.commentsPerPage));
  const defaultPage = settings.commentsDefaultPage === "last" ? totalPages : 1;
  const page = Math.min(Math.max(1, requestedPage ?? defaultPage), totalPages);
  const start = (page - 1) * settings.commentsPerPage;

  return {
    items: roots.slice(start, start + settings.commentsPerPage),
    approvedCount,
    page,
    totalPages,
    settings,
  };
}

export type AdminComment = {
  id: string;
  author: string;
  mail: string;
  url: string;
  ip: string;
  text: string;
  status: CommentStatus;
  createdLabel: string;
  postTitle: string;
  postSlug: string;
};

type RawAdminComment = Omit<AdminComment, "createdLabel"> & { createdAt: number };

export type AdminCommentQuery = {
  status: CommentStatus | "all";
  keywords?: string;
  page: number;
  pageSize?: number;
};

export function listCommentsForAdmin(query: AdminCommentQuery) {
  const where: string[] = [];
  const params: SQLInputValue[] = [];
  if (query.status !== "all") {
    where.push("cm.status = ?");
    params.push(query.status);
  }
  if (query.keywords?.trim()) {
    const keyword = `%${query.keywords.trim().replace(/[\\%_]/g, "\\$&")}%`;
    where.push(`(cm.text LIKE ? ESCAPE '\\' OR cm.author LIKE ? ESCAPE '\\'
      OR cm.mail LIKE ? ESCAPE '\\' OR p.title LIKE ? ESCAPE '\\')`);
    params.push(keyword, keyword, keyword, keyword);
  }
  const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";
  const pageSize = query.pageSize ?? 20;
  const total = get<{ value: number }>(
    `SELECT count(*) AS value FROM comments cm
     JOIN posts p ON p.id = cm.post_id ${whereSql}`,
    ...params,
  )?.value ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const rows = all<RawAdminComment>(
    `SELECT cm.id, cm.author, cm.mail, cm.url, cm.ip, cm.text, cm.status,
            cm.created_at AS createdAt, p.title AS postTitle, p.slug AS postSlug
     FROM comments cm JOIN posts p ON p.id = cm.post_id
     ${whereSql}
     ORDER BY cm.created_at DESC LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    (page - 1) * pageSize,
  );
  const counts = get<{ approved: number; waiting: number; spam: number }>(`
    SELECT
      sum(CASE WHEN status = 'approved' THEN 1 ELSE 0 END) AS approved,
      sum(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
      sum(CASE WHEN status = 'spam' THEN 1 ELSE 0 END) AS spam
    FROM comments
  `);

  return {
    items: rows.map((row) => ({
      ...row,
      createdLabel: formatCommentDate(row.createdAt),
    })),
    total,
    totalPages,
    page,
    counts: {
      approved: counts?.approved ?? 0,
      waiting: counts?.waiting ?? 0,
      spam: counts?.spam ?? 0,
    },
  };
}

export function getCommentDashboardData() {
  const total = get<{ count: number }>(
    "SELECT count(*) AS count FROM comments WHERE status = 'approved'",
  )?.count ?? 0;
  const recent = all<{
    id: string;
    author: string;
    text: string;
    postSlug: string;
    createdAt: number;
  }>(
    `SELECT cm.id, cm.author, cm.text, p.slug AS postSlug, cm.created_at AS createdAt
     FROM comments cm JOIN posts p ON p.id = cm.post_id
     WHERE cm.status = 'approved'
     ORDER BY cm.created_at DESC LIMIT 10`,
  ).map((comment) => ({
    ...comment,
    createdLabel: formatCommentDate(comment.createdAt),
  }));
  return { total, recent };
}

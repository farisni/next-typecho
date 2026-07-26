import type { SQLInputValue } from "node:sqlite";
import { notFound } from "next/navigation";
import { all, get } from "@/lib/db";

export type PostStatus = "draft" | "published" | "waiting" | "hidden" | "private";

type RawPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  renderedContent: string | null;
  status: PostStatus;
  allowComment: number;
  commentCount: number;
  publishedAt: number | null;
  createdAt: number;
  updatedAt: number;
  categoryId: string | null;
  categoryName: string | null;
  categorySlug: string | null;
};

type RawTag = { postId: string; id: string; name: string; slug: string };
type TaxonomyRow = { id: string; name: string; slug: string };

const postSelect = `
  SELECT p.id, p.title, p.slug, p.excerpt, p.content, p.status,
         p.rendered_content AS renderedContent,
         p.allow_comment AS allowComment,
         (SELECT count(*) FROM comments cm
          WHERE cm.post_id = p.id AND cm.status = 'approved') AS commentCount,
         p.published_at AS publishedAt, p.created_at AS createdAt,
         p.updated_at AS updatedAt, p.category_id AS categoryId,
         c.name AS categoryName, c.slug AS categorySlug
  FROM posts p
  LEFT JOIN categories c ON c.id = p.category_id
`;

function loadTags(postIds: string[]) {
  const result = new Map<string, TaxonomyRow[]>();
  if (!postIds.length) return result;
  const placeholders = postIds.map(() => "?").join(", ");
  const rows = all<RawTag>(
    `SELECT pt.post_id AS postId, t.id, t.name, t.slug
     FROM posts_to_tags pt JOIN tags t ON t.id = pt.tag_id
     WHERE pt.post_id IN (${placeholders}) ORDER BY t.name`,
    ...postIds,
  );
  for (const row of rows) {
    const tags = result.get(row.postId) ?? [];
    tags.push({ id: row.id, name: row.name, slug: row.slug });
    result.set(row.postId, tags);
  }
  return result;
}

function hydrate(rows: RawPost[]) {
  const tagMap = loadTags(rows.map(({ id }) => id));
  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt,
    content: row.content,
    renderedContent: row.renderedContent,
    status: row.status,
    allowComment: Boolean(row.allowComment),
    commentCount: row.commentCount,
    publishedAt: row.publishedAt === null ? null : new Date(row.publishedAt),
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    categoryId: row.categoryId,
    category:
      row.categoryId && row.categoryName && row.categorySlug
        ? { id: row.categoryId, name: row.categoryName, slug: row.categorySlug }
        : null,
    tags: tagMap.get(row.id) ?? [],
  }));
}

function paginate(whereSql: string, params: SQLInputValue[], page: number, pageSize: number) {
  const rows = all<RawPost>(
    `${postSelect} WHERE ${whereSql}
     ORDER BY p.published_at DESC LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    (page - 1) * pageSize,
  );
  const total = get<{ value: number }>(
    `SELECT count(*) AS value FROM posts p WHERE ${whereSql}`,
    ...params,
  )?.value ?? 0;
  return { items: hydrate(rows), total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}

const publishedWhere = "p.status = 'published' AND p.published_at <= ?";

function escapeLike(value: string) {
  return value.replace(/[\\%_]/g, "\\$&");
}

function buildSearchWhere(search: string) {
  const words = search.trim().split(/\s+/).filter(Boolean).slice(0, 8);
  const where = [publishedWhere];
  const params: SQLInputValue[] = [Date.now()];

  for (const word of words) {
    const keyword = `%${escapeLike(word)}%`;
    where.push(`(
      p.title LIKE ? ESCAPE '\\'
      OR p.excerpt LIKE ? ESCAPE '\\'
      OR p.content LIKE ? ESCAPE '\\'
      OR EXISTS (
        SELECT 1
        FROM posts_to_tags pt
        JOIN tags t ON t.id = pt.tag_id
        WHERE pt.post_id = p.id AND t.name LIKE ? ESCAPE '\\'
      )
    )`);
    params.push(keyword, keyword, keyword, keyword);
  }

  return { whereSql: where.join(" AND "), params };
}

export function listPublishedPosts(page: number, pageSize: number) {
  return paginate(publishedWhere, [Date.now()], page, pageSize);
}

export function searchPublishedPosts(search: string, page: number, pageSize: number) {
  const { whereSql, params } = buildSearchWhere(search);
  return paginate(whereSql, params, page, pageSize);
}

export function listAllPublishedPosts() {
  return hydrate(
    all<RawPost>(
      `${postSelect} WHERE ${publishedWhere} ORDER BY p.published_at DESC`,
      Date.now(),
    ),
  );
}

export function getPublishedPostBySlug(slug: string) {
  const row = get<RawPost>(
    `${postSelect} WHERE p.slug = ? AND ${publishedWhere} LIMIT 1`,
    slug,
    Date.now(),
  );
  if (!row) notFound();
  return hydrate([row])[0];
}

export function listPostsByCategory(slug: string, page: number, pageSize: number) {
  const category = get<TaxonomyRow>("SELECT id, name, slug FROM categories WHERE slug = ?", slug);
  if (!category) notFound();
  return {
    title: `分类 ${category.name} 下的文章`,
    categoryName: category.name,
    ...paginate(`${publishedWhere} AND p.category_id = ?`, [Date.now(), category.id], page, pageSize),
  };
}

export function listPostsByTag(slug: string, page: number, pageSize: number) {
  const tag = get<TaxonomyRow>("SELECT id, name, slug FROM tags WHERE slug = ?", slug);
  if (!tag) notFound();
  return {
    title: `标签 ${tag.name} 下的文章`,
    ...paginate(
      `${publishedWhere} AND EXISTS (
        SELECT 1 FROM posts_to_tags pt WHERE pt.post_id = p.id AND pt.tag_id = ?
      )`,
      [Date.now(), tag.id],
      page,
      pageSize,
    ),
  };
}

export function listAllPostsForAdmin() {
  return hydrate(all<RawPost>(`${postSelect} ORDER BY p.updated_at DESC`));
}

export type AdminPostListQuery = {
  status: "available" | "waiting" | "draft";
  keywords?: string;
  categoryId?: string;
  page: number;
  pageSize?: number;
};

export function listPostsForAdmin(query: AdminPostListQuery) {
  const where: string[] = [];
  const params: SQLInputValue[] = [];

  if (query.status === "draft") {
    where.push("p.status = 'draft'");
  } else if (query.status === "waiting") {
    where.push("p.status = 'waiting'");
  } else {
    where.push("p.status IN ('published', 'hidden', 'private')");
  }

  const words = query.keywords?.trim().split(/\s+/).filter(Boolean).slice(0, 8) ?? [];
  if (words.length) {
    where.push(`(${words.map(() => "p.title LIKE ? ESCAPE '\\'").join(" OR ")})`);
    params.push(...words.map((word) => `%${word.replace(/[\\%_]/g, "\\$&")}%`));
  }
  if (query.categoryId) {
    where.push("p.category_id = ?");
    params.push(query.categoryId);
  }

  const whereSql = where.join(" AND ");
  const total = get<{ value: number }>(
    `SELECT count(*) AS value FROM posts p WHERE ${whereSql}`,
    ...params,
  )?.value ?? 0;
  const pageSize = query.pageSize ?? 20;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const page = Math.min(Math.max(1, query.page), totalPages);
  const rows = all<RawPost>(
    `${postSelect} WHERE ${whereSql}
     ORDER BY p.updated_at DESC LIMIT ? OFFSET ?`,
    ...params,
    pageSize,
    (page - 1) * pageSize,
  );
  const counts = get<{ waiting: number; draft: number }>(
    `SELECT
       sum(CASE WHEN status = 'waiting' THEN 1 ELSE 0 END) AS waiting,
       sum(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) AS draft
     FROM posts`,
  );

  return {
    items: hydrate(rows),
    total,
    totalPages,
    page,
    counts: { waiting: counts?.waiting ?? 0, draft: counts?.draft ?? 0 },
  };
}

export function getPostByIdForAdmin(id: string) {
  const row = get<RawPost>(`${postSelect} WHERE p.id = ? LIMIT 1`, id);
  if (!row) notFound();
  return hydrate([row])[0];
}

export function getAdjacentPosts(publishedAt: Date) {
  const commonWhere = "status = 'published' AND published_at <= ?";
  const previous = get<{ title: string; slug: string }>(
    `SELECT title, slug FROM posts
     WHERE ${commonWhere} AND published_at < ? ORDER BY published_at DESC LIMIT 1`,
    Date.now(),
    publishedAt.getTime(),
  );
  const next = get<{ title: string; slug: string }>(
    `SELECT title, slug FROM posts
     WHERE ${commonWhere} AND published_at > ? ORDER BY published_at ASC LIMIT 1`,
    Date.now(),
    publishedAt.getTime(),
  );
  return { previous, next };
}

export function getSidebarContent() {
  const recentPosts = all<{ title: string; slug: string; commentCount: number }>(
    `SELECT title, slug,
            (SELECT count(*) FROM comments cm
             WHERE cm.post_id = posts.id AND cm.status = 'approved') AS commentCount
     FROM posts
     WHERE status = 'published' AND published_at <= ?
     ORDER BY published_at DESC LIMIT 5`,
    Date.now(),
  );
  const categories = all<{ name: string; slug: string; count: number }>(
    `SELECT c.name, c.slug, count(p.id) AS count
     FROM categories c
     LEFT JOIN posts p ON p.category_id = c.id
       AND p.status = 'published' AND p.published_at <= ?
     GROUP BY c.id ORDER BY c.name`,
    Date.now(),
  );
  const archives = all<{ month: string; count: number }>(
    `SELECT strftime('%Y年%m月', published_at / 1000, 'unixepoch') AS month,
            count(*) AS count
     FROM posts WHERE status = 'published' AND published_at <= ?
     GROUP BY strftime('%Y-%m', published_at / 1000, 'unixepoch')
     ORDER BY published_at DESC LIMIT 6`,
    Date.now(),
  );
  return { recentPosts, categories, archives };
}

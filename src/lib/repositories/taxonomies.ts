import { all, get } from "@/lib/db";

type Taxonomy = { id: string; name: string; slug: string };
export type TagDirectoryItem = Taxonomy & { postCount: number };

function toPlainTaxonomies(rows: Taxonomy[]): Taxonomy[] {
  // node:sqlite 的查询行没有普通 Object 原型，传给 Client Component 前必须重建。
  return rows.map(({ id, name, slug }) => ({ id, name, slug }));
}

export async function listTaxonomies() {
  return {
    categories: toPlainTaxonomies(all<Taxonomy>("SELECT id, name, slug FROM categories ORDER BY name")),
    tags: toPlainTaxonomies(all<Taxonomy>("SELECT id, name, slug FROM tags ORDER BY name")),
  };
}

export async function getTagDirectory() {
  const tags = all<TagDirectoryItem>(
    `SELECT t.id, t.name, t.slug, COUNT(DISTINCT p.id) AS postCount
     FROM tags t
     LEFT JOIN posts_to_tags pt ON pt.tag_id = t.id
     LEFT JOIN posts p
       ON p.id = pt.post_id
      AND p.status = 'published'
      AND p.published_at <= ?
     GROUP BY t.id, t.name, t.slug
     ORDER BY postCount DESC, t.name COLLATE NOCASE`,
    Date.now(),
  );
  const postCount = get<{ value: number }>(
    "SELECT COUNT(*) AS value FROM posts WHERE status = 'published' AND published_at <= ?",
    Date.now(),
  )?.value ?? 0;

  return {
    tags: tags.map(({ id, name, slug, postCount: count }) => ({ id, name, slug, postCount: Number(count) })),
    postCount,
  };
}

import { all } from "@/lib/db";

type Taxonomy = { id: string; name: string; slug: string };

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

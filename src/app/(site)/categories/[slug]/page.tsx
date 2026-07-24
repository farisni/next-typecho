import { Pagination } from "@/components/site/pagination";
import { PostList } from "@/components/site/post-list";
import { listPostsByCategory } from "@/lib/repositories/posts";
import { getSiteSettings } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ slug }, query, settings] = await Promise.all([params, searchParams, getSiteSettings()]);
  const page = Math.max(1, Number(query.page) || 1);
  const result = await listPostsByCategory(slug, page, settings.postsPerPage);

  return <><h1 className="archive-title">{result.title}</h1><PostList posts={result.items} /><Pagination page={page} totalPages={result.totalPages} /></>;
}

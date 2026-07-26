import { Pagination } from "@/components/site/pagination";
import { PostList } from "@/components/site/post-list";
import { listPublishedPosts, searchPublishedPosts } from "@/lib/repositories/posts";
import { getSiteSettings } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string; q?: string }> }) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const search = query.q?.trim() ?? "";
  const settings = await getSiteSettings();
  const result = search
    ? searchPublishedPosts(search, page, settings.postsPerPage)
    : listPublishedPosts(page, settings.postsPerPage);

  return (
    <>
      {search && (
        <section className="lite-search-summary" aria-label="搜索结果">
          <h2 className="post-title">搜索：{search}</h2>
          <p>找到 {result.total} 篇相关文章</p>
        </section>
      )}
      <PostList posts={result.items} />
      <Pagination page={page} totalPages={result.totalPages} query={search ? { q: search } : undefined} />
    </>
  );
}

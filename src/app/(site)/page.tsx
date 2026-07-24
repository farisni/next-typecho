import { Pagination } from "@/components/site/pagination";
import { PostList } from "@/components/site/post-list";
import { listPublishedPosts } from "@/lib/repositories/posts";
import { getSiteSettings } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

export default async function HomePage({ searchParams }: { searchParams: Promise<{ page?: string }> }) {
  const query = await searchParams;
  const page = Math.max(1, Number(query.page) || 1);
  const settings = await getSiteSettings();
  const result = await listPublishedPosts(page, settings.postsPerPage);

  return (
    <>
      <PostList posts={result.items} />
      <Pagination page={page} totalPages={result.totalPages} />
    </>
  );
}

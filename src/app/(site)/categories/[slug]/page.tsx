import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { Pagination } from "@/components/site/pagination";
import { PostList } from "@/components/site/post-list";
import { listPostsByCategory } from "@/lib/repositories/posts";
import { getSiteSettings } from "@/lib/repositories/settings";

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> }) {
  const [{ slug }, query, settings] = await Promise.all([params, searchParams, getSiteSettings()]);
  const page = Math.max(1, Number(query.page) || 1);
  const result = await listPostsByCategory(slug, page, settings.postsPerPage);

  return (
    <div className="lite-category-page">
      <header className="lite-category-header">
        <h1>
          <span>分类</span> <strong className="lite-category-name">{result.categoryName}</strong> <span>下的文章</span>
        </h1>
      </header>
      <div className="lite-category-content">
        <nav className="lite-category-breadcrumb" aria-label="面包屑导航">
          <Link href="/">
            <Home aria-hidden="true" />
            <span>首页</span>
          </Link>
          <ChevronRight className="lite-breadcrumb-separator" aria-hidden="true" />
          <span aria-current="page">{result.categoryName}</span>
        </nav>
        <PostList posts={result.items} />
        <Pagination page={page} totalPages={result.totalPages} />
      </div>
    </div>
  );
}

import Link from "next/link";
import { AdminPageTitle } from "@/components/admin/admin-page-title";
import { AdminPostList } from "@/components/admin/admin-post-list";
import { requireAdministrator } from "@/lib/auth/session";
import { listPostsForAdmin } from "@/lib/repositories/posts";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

type PostsSearchParams = {
  status?: string | string[];
  scope?: string | string[];
  keywords?: string | string[];
  category?: string | string[];
  page?: string | string[];
  notice?: string | string[];
};

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

function relativeDate(date: Date) {
  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000));
  if (seconds < 60) return "刚刚";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} 分钟前`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} 小时前`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)} 天前`;
  return date.toLocaleDateString("zh-CN");
}

function tabHref(status: "available" | "waiting" | "draft", scope: "all" | "mine") {
  const params = new URLSearchParams();
  if (status !== "available") params.set("status", status);
  if (scope === "all") params.set("scope", "all");
  const query = params.toString();
  return `/admin/posts${query ? `?${query}` : ""}`;
}

export default async function AdminPostsPage({ searchParams }: { searchParams: Promise<PostsSearchParams> }) {
  const [query, user, { categories }] = await Promise.all([
    searchParams,
    requireAdministrator("/admin/posts"),
    listTaxonomies(),
  ]);
  const requestedStatus = one(query.status);
  const status = requestedStatus === "waiting" || requestedStatus === "draft" ? requestedStatus : "available";
  const scope = one(query.scope) === "all" ? "all" : "mine";
  const keywords = one(query.keywords).trim();
  const categoryId = one(query.category);
  const requestedPage = Number.parseInt(one(query.page), 10);
  const result = listPostsForAdmin({
    status,
    keywords,
    categoryId,
    page: Number.isFinite(requestedPage) ? requestedPage : 1,
  });

  const currentParams = new URLSearchParams();
  if (status !== "available") currentParams.set("status", status);
  if (scope === "all") currentParams.set("scope", "all");
  if (keywords) currentParams.set("keywords", keywords);
  if (categoryId) currentParams.set("category", categoryId);
  if (result.page > 1) currentParams.set("page", String(result.page));
  const cancelFilterHref = tabHref(status, scope);

  return (
    <>
      <AdminPageTitle title="管理文章" addHref="/admin/posts/new" />
      {one(query.notice) && <div className="message success admin-post-notice">{one(query.notice)}</div>}
      <div className="typecho-list-operate list-tabs-row">
        <ul className="typecho-option-tabs">
          <li className={status === "available" ? "current" : undefined}><Link href={tabHref("available", scope)}>可用</Link></li>
          <li className={status === "waiting" ? "current" : undefined}>
            <Link href={tabHref("waiting", scope)}>待审核{result.counts.waiting > 0 && <span className="balloon">{result.counts.waiting}</span>}</Link>
          </li>
          <li className={status === "draft" ? "current" : undefined}>
            <Link href={tabHref("draft", scope)}>草稿{result.counts.draft > 0 && <span className="balloon">{result.counts.draft}</span>}</Link>
          </li>
        </ul>
        <ul className="typecho-option-tabs">
          <li className={scope === "all" ? "current" : undefined}><Link href={tabHref(status, "all")}>所有</Link></li>
          <li className={scope === "mine" ? "current" : undefined}><Link href={tabHref(status, "mine")}>我的</Link></li>
        </ul>
      </div>
      <AdminPostList
        key={currentParams.toString() || "default"}
        posts={result.items.map((post) => ({
          id: post.id,
          title: post.title,
          slug: post.slug,
          status: post.status,
          category: post.category ? { id: post.category.id, name: post.category.name } : null,
          dateLabel: post.status === "draft" ? `保存于 ${relativeDate(post.updatedAt)}` : relativeDate(post.publishedAt ?? post.updatedAt),
          commentCount: post.commentCount,
        }))}
        categories={categories.map(({ id, name }) => ({ id, name }))}
        status={status}
        scope={scope}
        keywords={keywords}
        categoryId={categoryId}
        page={result.page}
        totalPages={result.totalPages}
        currentQuery={currentParams.toString()}
        cancelFilterHref={cancelFilterHref}
        authorName={user.displayName}
      />
    </>
  );
}

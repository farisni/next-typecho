"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { CalendarClock, Check, Clock, ExternalLink, EyeOff, Globe, ListFilter, Lock, MoreHorizontal, PenLine, Search, SquareX, Trash2 } from "lucide-react";
import { bulkManagePosts } from "@/actions/posts";
import { AdminBulkMenu } from "@/components/admin/admin-bulk-menu";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PostStatus } from "@/lib/repositories/posts";

type AdminPostItem = {
  id: string;
  title: string;
  slug: string;
  status: PostStatus;
  category: { id: string; name: string } | null;
  dateLabel: string;
};

type Category = { id: string; name: string };

type AdminPostListProps = {
  posts: AdminPostItem[];
  categories: Category[];
  status: "available" | "waiting" | "draft";
  scope: "all" | "mine";
  keywords: string;
  categoryId: string;
  page: number;
  totalPages: number;
  currentQuery: string;
  cancelFilterHref: string;
  authorName: string;
};

const statusLabels: Partial<Record<PostStatus, string>> = {
  draft: "草稿",
  waiting: "待审核",
  hidden: "隐藏",
  private: "私密",
};

function buildQuery(currentQuery: string, changes: Record<string, string | null>) {
  const params = new URLSearchParams(currentQuery);
  for (const [key, value] of Object.entries(changes)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  return `/admin/posts${query ? `?${query}` : ""}`;
}

function Pager({ page, totalPages, currentQuery }: { page: number; totalPages: number; currentQuery: string }) {
  if (totalPages <= 1) return null;
  const candidates = new Set([1, totalPages, page - 2, page - 1, page, page + 1, page + 2]);
  const pages = [...candidates].filter((value) => value >= 1 && value <= totalPages).sort((a, b) => a - b);

  return (
    <ul className="typecho-pager" aria-label="分页">
      {page > 1 && <li><Link href={buildQuery(currentQuery, { page: String(page - 1) })}>«</Link></li>}
      {pages.map((number, index) => (
        <Fragment key={number}>
          {index > 0 && number - pages[index - 1] > 1 && <li><span>…</span></li>}
          <li className={number === page ? "current" : undefined}>
            <Link href={buildQuery(currentQuery, { page: number === 1 ? null : String(number) })} aria-current={number === page ? "page" : undefined}>{number}</Link>
          </li>
        </Fragment>
      ))}
      {page < totalPages && <li><Link href={buildQuery(currentQuery, { page: String(page + 1) })}>»</Link></li>}
    </ul>
  );
}

export function AdminPostList({
  posts,
  categories,
  status,
  scope,
  keywords,
  categoryId,
  page,
  totalPages,
  currentQuery,
  cancelFilterHref,
  authorName,
}: AdminPostListProps) {
  const formId = "manage-posts";
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const topSelectAll = useRef<HTMLInputElement>(null);
  const allSelected = posts.length > 0 && selected.size === posts.length;
  const partlySelected = selected.size > 0 && !allSelected;
  const returnTo = useMemo(() => `/admin/posts${currentQuery ? `?${currentQuery}` : ""}`, [currentQuery]);

  useEffect(() => {
    if (topSelectAll.current) topSelectAll.current.indeterminate = partlySelected;
  }, [partlySelected]);

  function selectAll(checked: boolean) {
    setSelected(checked ? new Set(posts.map((post) => post.id)) : new Set());
  }

  function selectPost(postId: string, checked: boolean) {
    setSelected((current) => {
      const next = new Set(current);
      if (checked) next.add(postId);
      else next.delete(postId);
      return next;
    });
  }

  return (
    <>
      <div className="typecho-list-operate post-list-toolbar">
        <div className="operate">
          <AdminBulkMenu
            formId={formId}
            actions={[
              { icon: Trash2, label: "删除", name: "operation", value: "delete", variant: "destructive" },
              { icon: Globe, label: "公开", name: "operation", value: "published" },
              { icon: Clock, label: "待审核", name: "operation", value: "waiting" },
              { icon: EyeOff, label: "隐藏", name: "operation", value: "hidden" },
              { icon: Lock, label: "私密", name: "operation", value: "private" },
            ]}
          />
        </div>
        <form method="get" className="search" role="search">
          <label className="admin-filter-keywords">
            <span className="sr-only">搜索文章</span>
            <Search aria-hidden="true" />
            <input type="text" className="text-s" placeholder="请输入关键字" defaultValue={keywords} name="keywords" />
          </label>
          {categoryId && <input type="hidden" name="category" value={categoryId} />}
          <DropdownMenu>
            <DropdownMenuTrigger
              render={(
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-none bg-[#f6f6f3]"
                />
              )}
            >
              <ListFilter data-icon="inline-start" aria-hidden="true" />
              筛选
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="rounded-none">
              <DropdownMenuGroup>
                <DropdownMenuItem
                  className="w-full rounded-none"
                  render={<Link href={buildQuery(currentQuery, { category: null, page: null })} />}
                >
                  {!categoryId && <Check aria-hidden="true" />}
                  所有分类
                </DropdownMenuItem>
                {categories.map((category) => (
                  <DropdownMenuItem
                    key={category.id}
                    className="w-full rounded-none"
                    render={(
                      <Link
                        href={buildQuery(currentQuery, {
                          category: category.id,
                          page: null,
                        })}
                      />
                    )}
                  >
                    {categoryId === category.id && <Check aria-hidden="true" />}
                    {category.name}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {(keywords || categoryId) && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      className="w-full rounded-none"
                      render={<Link href={cancelFilterHref} />}
                    >
                      <SquareX aria-hidden="true" />
                      取消筛选
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          {status !== "available" && <input type="hidden" name="status" value={status} />}
          {scope === "all" && <input type="hidden" name="scope" value="all" />}
        </form>
      </div>

      <form
        id={formId}
        action={bulkManagePosts}
        className="operate-form"
        onSubmit={(event) => {
          if (selected.size === 0) {
            event.preventDefault();
            window.alert("请选择要操作的文章");
            return;
          }
          const submitter = (event.nativeEvent as SubmitEvent).submitter as HTMLButtonElement | null;
          if (submitter?.value === "delete" && !window.confirm("你确认要删除这些文章吗?")) event.preventDefault();
        }}
      >
        <input type="hidden" name="returnTo" value={returnTo} />
        <table className="typecho-list-table post-list-table">
          <colgroup>
            <col className="admin-check-column" />
            <col />
            <col className="post-comments-col" />
            <col className="admin-author-column" />
            <col className="admin-category-column" />
            <col className="post-date-col" />
            <col className="post-actions-col" />
          </colgroup>
          <thead>
            <tr>
              <th className="kit-hidden-mb">
                <label>
                  <span className="sr-only">全选</span>
                  <input
                    ref={topSelectAll}
                    type="checkbox"
                    className="typecho-table-select-all"
                    checked={allSelected}
                    onChange={(event) => selectAll(event.target.checked)}
                  />
                </label>
              </th>
              <th>标题</th>
              <th className="kit-hidden-mb post-comments-column">评论</th>
              <th className="kit-hidden-mb">作者</th>
              <th className="kit-hidden-mb">分类</th>
              <th>日期</th>
              <th className="post-actions-column">操作</th>
            </tr>
          </thead>
          <tbody>
            {posts.length === 0 && <tr><td colSpan={7} className="none">没有任何文章</td></tr>}
            {posts.map((post) => {
              const checked = selected.has(post.id);
              return (
                <tr
                  key={post.id}
                  className={checked ? "current" : undefined}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("a, button, input, select, textarea, label, summary")) return;
                    selectPost(post.id, !checked);
                  }}
                >
                  <td className="kit-hidden-mb"><input type="checkbox" value={post.id} name="postIds" checked={checked} onChange={(event) => selectPost(post.id, event.target.checked)} aria-label={`选择 ${post.title}`} /></td>
                  <td>
                    <Link href={`/admin/posts/${post.id}/edit`}>{post.title}</Link>
                    {statusLabels[post.status] && <em className="status">{statusLabels[post.status]}</em>}
                  </td>
                  <td className="kit-hidden-mb post-comments-column"><span className="post-comment-count" title="0 评论">0</span></td>
                  <td className="kit-hidden-mb">
                    <Link
                      className="post-author-avatar"
                      href={buildQuery(currentQuery, { scope: null, page: null })}
                      title={authorName}
                      aria-label={`查看作者 ${authorName} 的文章`}
                    >
                      {authorName.trim().charAt(0).toUpperCase()}
                    </Link>
                  </td>
                  <td className="kit-hidden-mb">
                    {post.category ? <Link href={buildQuery(currentQuery, { category: post.category.id, page: null })}>{post.category.name}</Link> : "未分类"}
                  </td>
                  <td>
                    <span className="post-date-badge">
                      <CalendarClock aria-hidden="true" />
                      <span>{post.dateLabel}</span>
                    </span>
                  </td>
                  <td className="post-actions-cell">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={(
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="post-actions-trigger"
                            aria-label={`打开 ${post.title} 的操作菜单`}
                          >
                            <MoreHorizontal aria-hidden="true" />
                          </Button>
                        )}
                      />
                      <DropdownMenuContent align="end" className="post-actions-menu rounded-none">
                        <DropdownMenuItem render={<Link href={`/admin/posts/${post.id}/edit`} />}>
                          <PenLine aria-hidden="true" />
                          编辑文章
                        </DropdownMenuItem>
                        {post.status !== "draft" && post.status !== "waiting" && (
                          <DropdownMenuItem render={<Link href={`/posts/${post.slug}`} />}>
                            <ExternalLink aria-hidden="true" />
                            浏览文章
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>

      <div className="typecho-list-operate bottom-operate">
        <Pager page={page} totalPages={totalPages} currentQuery={currentQuery} />
      </div>
    </>
  );
}

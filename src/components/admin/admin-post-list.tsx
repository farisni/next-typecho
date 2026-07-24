"use client";

import Link from "next/link";
import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Clock, EyeOff, Globe, Lock, Trash2 } from "lucide-react";
import { bulkManagePosts } from "@/actions/posts";
import { AdminBulkMenu } from "@/components/admin/admin-bulk-menu";
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
  const bottomSelectAll = useRef<HTMLInputElement>(null);
  const allSelected = posts.length > 0 && selected.size === posts.length;
  const partlySelected = selected.size > 0 && !allSelected;
  const returnTo = useMemo(() => `/admin/posts${currentQuery ? `?${currentQuery}` : ""}`, [currentQuery]);

  useEffect(() => {
    for (const checkbox of [topSelectAll.current, bottomSelectAll.current]) {
      if (checkbox) checkbox.indeterminate = partlySelected;
    }
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
      <div className="typecho-list-operate">
        <div className="operate">
          <label><span className="sr-only">全选</span><input ref={topSelectAll} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} /></label>
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
          {(keywords || categoryId) && <Link href={cancelFilterHref}>« 取消筛选</Link>}
          <input type="text" className="text-s" placeholder="请输入关键字" defaultValue={keywords} name="keywords" />
          <select name="category" defaultValue={categoryId}>
            <option value="">所有分类</option>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
          <button type="submit" className="btn btn-s">筛选</button>
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
          <colgroup><col className="admin-check-column" /><col className="admin-comment-column" /><col /><col className="admin-author-column" /><col className="admin-category-column" /><col className="admin-date-column" /></colgroup>
          <thead><tr><th className="kit-hidden-mb" /><th className="kit-hidden-mb" /><th>标题</th><th className="kit-hidden-mb">作者</th><th className="kit-hidden-mb">分类</th><th>日期</th></tr></thead>
          <tbody>
            {posts.length === 0 && <tr><td colSpan={6} className="none">没有任何文章</td></tr>}
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
                  <td className="kit-hidden-mb"><span className="balloon-button" title="0 评论">0</span></td>
                  <td>
                    <Link href={`/admin/posts/${post.id}/edit`}>{post.title}</Link>
                    {statusLabels[post.status] && <em className="status">{statusLabels[post.status]}</em>}
                    <Link className="row-action" href={`/admin/posts/${post.id}/edit`} title={`编辑 ${post.title}`}><i className="i-edit">编辑</i></Link>
                    {post.status !== "draft" && post.status !== "waiting" && <Link className="row-action" href={`/posts/${post.slug}`} title={`浏览 ${post.title}`}><i className="i-exlink">浏览</i></Link>}
                  </td>
                  <td className="kit-hidden-mb"><Link href={buildQuery(currentQuery, { scope: null, page: null })}>{authorName}</Link></td>
                  <td className="kit-hidden-mb">
                    {post.category ? <Link href={buildQuery(currentQuery, { category: post.category.id, page: null })}>{post.category.name}</Link> : "未分类"}
                  </td>
                  <td><span className="description-text">{post.dateLabel}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </form>

      <div className="typecho-list-operate bottom-operate">
        <div className="operate">
          <label><span className="sr-only">全选</span><input ref={bottomSelectAll} type="checkbox" className="typecho-table-select-all" checked={allSelected} onChange={(event) => selectAll(event.target.checked)} /></label>
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
        <Pager page={page} totalPages={totalPages} currentQuery={currentQuery} />
      </div>
    </>
  );
}

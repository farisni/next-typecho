"use client";

import { useState } from "react";
import Link from "next/link";
import {
  bulkManageComments,
  deleteAllSpamComments,
  editComment,
  replyComment,
} from "@/actions/comments";
import type {
  AdminComment,
  CommentStatus,
} from "@/lib/repositories/comments";

type AdminCommentListProps = {
  items: AdminComment[];
  total: number;
  totalPages: number;
  page: number;
  counts: { approved: number; waiting: number; spam: number };
  status: CommentStatus | "all";
  keywords: string;
  notice?: string;
};

function buildUrl(
  current: { status: string; keywords: string },
  changes: { status?: string; page?: number },
) {
  const params = new URLSearchParams();
  const status = changes.status ?? current.status;
  if (status !== "approved") params.set("status", status);
  if (current.keywords) params.set("keywords", current.keywords);
  if (changes.page && changes.page > 1) params.set("page", String(changes.page));
  const query = params.toString();
  return query ? `/admin/comments?${query}` : "/admin/comments";
}

const statusLabels: Record<CommentStatus, string> = {
  approved: "已通过",
  waiting: "待审核",
  spam: "垃圾",
};

export function AdminCommentList(props: AdminCommentListProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const current = { status: props.status, keywords: props.keywords };
  const returnTo = buildUrl(current, { page: props.page });
  const allSelected = props.items.length > 0 && selected.length === props.items.length;

  return (
    <div className="admin-comments-page">
      {props.notice && <div className="message success">{props.notice}</div>}

      <ul className="typecho-option-tabs">
        {([
          ["approved", "已通过", props.counts.approved],
          ["waiting", "待审核", props.counts.waiting],
          ["spam", "垃圾", props.counts.spam],
          ["all", "全部", props.counts.approved + props.counts.waiting + props.counts.spam],
        ] as const).map(([value, label, count]) => (
          <li key={value} className={props.status === value ? "current" : undefined}>
            <Link href={buildUrl(current, { status: value })}>
              {label} <span className="balloon">{count}</span>
            </Link>
          </li>
        ))}
      </ul>

      <div className="typecho-list-operate comment-list-toolbar">
        <span className="comment-result-count">共 {props.total} 条</span>
        <form className="search" method="get">
          {props.status !== "approved" && <input type="hidden" name="status" value={props.status} />}
          <input className="text-s" name="keywords" defaultValue={props.keywords} placeholder="搜索评论" />
          <button className="btn btn-s" type="submit">筛选</button>
        </form>
        {props.status === "spam" && props.counts.spam > 0 && (
          <form action={deleteAllSpamComments}>
            <input type="hidden" name="returnTo" value={returnTo} />
            <button className="btn btn-s" type="submit">清空垃圾评论</button>
          </form>
        )}
      </div>

      <form id="comment-bulk-form" action={bulkManageComments}>
        <input type="hidden" name="returnTo" value={returnTo} />
      </form>
      <div className="comment-bulk-controls">
        <select name="operation" form="comment-bulk-form" defaultValue="">
          <option value="" disabled>批量操作</option>
          <option value="approved">标记为已通过</option>
          <option value="waiting">标记为待审核</option>
          <option value="spam">标记为垃圾</option>
          <option value="delete">删除</option>
        </select>
        <button className="btn btn-s" type="submit" form="comment-bulk-form">应用</button>
      </div>

      <table className="typecho-list-table admin-comments-table">
        <colgroup>
          <col className="admin-check-column" />
          <col />
          <col className="admin-comment-author-col" />
          <col className="admin-comment-response-col" />
          <col className="admin-date-column" />
        </colgroup>
        <thead>
          <tr>
            <th>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={(event) => setSelected(event.target.checked ? props.items.map(({ id }) => id) : [])}
                aria-label="选择全部评论"
              />
            </th>
            <th>评论</th>
            <th>评论者</th>
            <th>回应给</th>
            <th>日期</th>
          </tr>
        </thead>
        <tbody>
          {props.items.length === 0 ? (
            <tr><td className="none" colSpan={5}>没有评论</td></tr>
          ) : props.items.map((comment) => {
            const editAction = editComment.bind(null, comment.id);
            const replyAction = replyComment.bind(null, comment.id);
            return (
              <tr key={comment.id}>
                <td>
                  <input
                    form="comment-bulk-form"
                    type="checkbox"
                    name="commentIds"
                    value={comment.id}
                    checked={selected.includes(comment.id)}
                    onChange={(event) => setSelected((currentIds) => (
                      event.target.checked
                        ? [...currentIds, comment.id]
                        : currentIds.filter((id) => id !== comment.id)
                    ))}
                    aria-label={`选择 ${comment.author} 的评论`}
                  />
                </td>
                <td>
                  <p className="admin-comment-text">{comment.text}</p>
                  <span className={`admin-comment-status status-${comment.status}`}>
                    {statusLabels[comment.status]}
                  </span>
                  <div className="admin-comment-actions">
                    {comment.status !== "approved" && (
                      <form action={bulkManageComments}>
                        <input type="hidden" name="commentIds" value={comment.id} />
                        <input type="hidden" name="operation" value="approved" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit">通过</button>
                      </form>
                    )}
                    {comment.status !== "waiting" && (
                      <form action={bulkManageComments}>
                        <input type="hidden" name="commentIds" value={comment.id} />
                        <input type="hidden" name="operation" value="waiting" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit">待审</button>
                      </form>
                    )}
                    {comment.status !== "spam" && (
                      <form action={bulkManageComments}>
                        <input type="hidden" name="commentIds" value={comment.id} />
                        <input type="hidden" name="operation" value="spam" />
                        <input type="hidden" name="returnTo" value={returnTo} />
                        <button type="submit">垃圾</button>
                      </form>
                    )}
                    <form action={bulkManageComments}>
                      <input type="hidden" name="commentIds" value={comment.id} />
                      <input type="hidden" name="operation" value="delete" />
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <button className="danger" type="submit">删除</button>
                    </form>
                  </div>
                  <details className="admin-comment-editor">
                    <summary>编辑</summary>
                    <form action={editAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <input name="author" defaultValue={comment.author} required maxLength={150} />
                      <input name="mail" type="email" defaultValue={comment.mail} maxLength={150} />
                      <input name="url" defaultValue={comment.url} maxLength={255} />
                      <textarea name="text" defaultValue={comment.text} required rows={5} maxLength={10000} />
                      <button className="btn btn-s primary" type="submit">保存编辑</button>
                    </form>
                  </details>
                  <details className="admin-comment-editor">
                    <summary>回复</summary>
                    <form action={replyAction}>
                      <input type="hidden" name="returnTo" value={returnTo} />
                      <textarea name="text" required rows={4} maxLength={10000} />
                      <button className="btn btn-s primary" type="submit">发布回复</button>
                    </form>
                  </details>
                </td>
                <td>
                  <strong>{comment.author}</strong>
                  {comment.mail && <a href={`mailto:${comment.mail}`}>{comment.mail}</a>}
                  {comment.url && <a href={comment.url} target="_blank" rel="noreferrer">{comment.url}</a>}
                  {comment.ip && <small>{comment.ip}</small>}
                </td>
                <td><Link href={`/posts/${comment.postSlug}#comment-${comment.id}`}>{comment.postTitle}</Link></td>
                <td>{comment.createdLabel}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {props.totalPages > 1 && (
        <nav className="admin-comment-pagination" aria-label="评论分页">
          {Array.from({ length: props.totalPages }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={buildUrl(current, { page })}
              aria-current={page === props.page ? "page" : undefined}
            >
              {page}
            </Link>
          ))}
        </nav>
      )}
    </div>
  );
}

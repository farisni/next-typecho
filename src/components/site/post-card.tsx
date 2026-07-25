import Link from "next/link";
import { Clock3, FolderOpen, MessageSquare, UserRound } from "lucide-react";
import { formatPostDate } from "@/lib/format-date";

type PostCardProps = {
  post: {
    title: string;
    slug: string;
    excerpt: string | null;
    content: string;
    publishedAt: Date | null;
    category: { name: string; slug: string } | null;
    tags: { id: string; name: string; slug: string }[];
  };
};

function formatHandsomePostDate(date: Date) {
  const parts = new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";

  return `${value("year")} 年 ${value("month")} 月 ${value("day")} 日`;
}

function formatPaperPostDate(date: Date) {
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post post-card">
      <h2 className="post-title">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <ul className="post-meta">
        <li>
          <UserRound className="post-meta-icon" aria-hidden="true" />
          <span className="post-meta-label">作者: </span>
          <span>管理员</span>
        </li>
        {post.publishedAt && (
          <li>
            <Clock3 className="post-meta-icon" aria-hidden="true" />
            <span className="post-meta-label">时间: </span>
            <time>
              <span className="post-date-default">{formatPostDate(post.publishedAt)}</span>
              <span className="post-date-handsome">{formatHandsomePostDate(post.publishedAt)}</span>
              <span className="post-date-paper">{formatPaperPostDate(post.publishedAt)}</span>
            </time>
          </li>
        )}
        <li>
          <FolderOpen className="post-meta-icon" aria-hidden="true" />
          <span className="post-meta-label">分类: </span>
          {post.category ? <Link href={`/categories/${post.category.slug}`}>{post.category.name}</Link> : "未分类"}
        </li>
        <li>
          <MessageSquare className="post-meta-icon" aria-hidden="true" />
          <Link href={`/posts/${post.slug}#comments`}>暂无评论</Link>
        </li>
      </ul>
      <div className="post-content">
        <p>{post.excerpt ?? post.content.slice(0, 180)}</p>
      </div>
    </article>
  );
}

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { ClickablePostCard } from "@/components/site/clickable-post-card";
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
    commentCount: number;
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
  const parts = new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const month = ["一月", "二月", "三月", "四月", "五月", "六月", "七月", "八月", "九月", "十月", "十一月", "十二月"][Number(value("month")) - 1];
  return { day: value("day"), month, year: value("year") };
}

function PaperDate({ date }: { date: Date }) {
  const formatted = formatPaperPostDate(date);
  return <time><span>{formatted.day}</span> <span className="paper-date-month">{formatted.month}</span> <span>{formatted.year}</span></time>;
}

export function PostCard({ post }: PostCardProps) {
  return (
    <ClickablePostCard
      href={`/posts/${post.slug}`}
      label={`阅读文章：${post.title}`}
    >
      <h2 className="post-title">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
        <svg
          className="post-card-arrow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <line className="post-card-arrow-line" x1="5" y1="12" x2="19" y2="12" />
          <polyline className="post-card-arrow-tip" points="12 5 19 12 12 19" />
        </svg>
      </h2>
      <ul className="post-meta">
        <li className="post-card-category">
          {post.category ? (
            <Link className="post-card-category-tag" href={`/categories/${post.category.slug}`}>
              <span className="post-card-category-hash">#</span>
              {post.category.name}
            </Link>
          ) : (
            <span className="post-card-category-tag">
              <span className="post-card-category-hash">#</span>
              未分类
            </span>
          )}
        </li>
        {post.publishedAt && (
          <li>
            <span className="post-meta-label">时间: </span>
            <span className="post-date-default">{formatPostDate(post.publishedAt)}</span>
            <span className="post-date-handsome">{formatHandsomePostDate(post.publishedAt)}</span>
            <span className="post-date-paper"><PaperDate date={post.publishedAt} /></span>
          </li>
        )}
        <li>
          <MessageSquare className="post-meta-icon" aria-hidden="true" />
          <Link href={`/posts/${post.slug}#comments`}>
            {post.commentCount ? `${post.commentCount} 条评论` : "暂无评论"}
          </Link>
        </li>
      </ul>
      <div className="post-content">
        <p>{post.excerpt ?? post.content.slice(0, 180)}</p>
      </div>
    </ClickablePostCard>
  );
}

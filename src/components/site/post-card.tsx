import Link from "next/link";
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

export function PostCard({ post }: PostCardProps) {
  return (
    <article className="post">
      <h2 className="post-title">
        <Link href={`/posts/${post.slug}`}>{post.title}</Link>
      </h2>
      <ul className="post-meta">
        <li>作者: <span>管理员</span></li>
        {post.publishedAt && <li>时间: <time>{formatPostDate(post.publishedAt)}</time></li>}
        <li>分类: {post.category ? <Link href={`/categories/${post.category.slug}`}>{post.category.name}</Link> : "未分类"}</li>
        <li><Link href={`/posts/${post.slug}#comments`}>暂无评论</Link></li>
      </ul>
      <div className="post-content">
        <p>{post.excerpt ?? post.content.slice(0, 180)}</p>
      </div>
    </article>
  );
}

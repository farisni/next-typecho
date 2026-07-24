import Link from "next/link";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { formatPostDate } from "@/lib/format-date";
import { getAdjacentPosts, getPublishedPostBySlug } from "@/lib/repositories/posts";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  // App Router 的 [slug] 是动态路由段，params 中的 slug 来自当前 URL。
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const nearby = post.publishedAt ? getAdjacentPosts(post.publishedAt) : { previous: undefined, next: undefined };

  return (
    <>
      <article className="post">
        <h1 className="post-title"><Link href={`/posts/${post.slug}`}>{post.title}</Link></h1>
        <ul className="post-meta">
          <li>作者: <span>管理员</span></li>
          {post.publishedAt && <li>时间: <time>{formatPostDate(post.publishedAt)}</time></li>}
          <li>分类: {post.category ? <Link href={`/categories/${post.category.slug}`}>{post.category.name}</Link> : "未分类"}</li>
        </ul>
        <MarkdownContent content={post.content} />
        <p className="tags">标签: {post.tags.length ? post.tags.map((tag, index) => <span key={tag.id}>{index > 0 && ", "}<Link href={`/tags/${tag.slug}`}>{tag.name}</Link></span>) : "none"}</p>
      </article>
      <ul className="post-near">
        <li>上一篇: {nearby.previous ? <Link href={`/posts/${nearby.previous.slug}`}>{nearby.previous.title}</Link> : "没有了"}</li>
        <li>下一篇: {nearby.next ? <Link href={`/posts/${nearby.next.slug}`}>{nearby.next.title}</Link> : "没有了"}</li>
      </ul>
    </>
  );
}

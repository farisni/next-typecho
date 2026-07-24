import Link from "next/link";
import {
  Bot,
  Clock3,
  Eye,
  FolderOpen,
  Home,
  MessageCircle,
  Share2,
  Star,
  UserRound,
} from "lucide-react";
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
      <article className="post post-detail">
        <header className="post-detail-header">
          <div className="post-detail-header-content">
            <h1 className="post-title"><Link href={`/posts/${post.slug}`}>{post.title}</Link></h1>
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
                  <time>{formatPostDate(post.publishedAt)}</time>
                </li>
              )}
              <li>
                <Eye className="post-meta-icon" aria-hidden="true" />
                <span>0 浏览</span>
              </li>
              <li>
                <MessageCircle className="post-meta-icon" aria-hidden="true" />
                <Link href="#comments">暂无评论</Link>
              </li>
              <li>
                <FolderOpen className="post-meta-icon" aria-hidden="true" />
                <span className="post-meta-label">分类: </span>
                {post.category ? <Link href={`/categories/${post.category.slug}`}>{post.category.name}</Link> : "未分类"}
              </li>
            </ul>
          </div>
        </header>

        <nav className="post-breadcrumb" aria-label="面包屑">
          <div className="post-breadcrumb-path">
            <Home aria-hidden="true" />
            <Link href="/">首页</Link>
            <span>/</span>
            <span>正文</span>
          </div>
          <div className="post-share" aria-label="分享文章">
            <span>分享到：</span>
            <button type="button" aria-label="收藏文章">
              <Star aria-hidden="true" />
            </button>
            <span>/</span>
            <button type="button" aria-label="分享文章">
              <Share2 aria-hidden="true" />
            </button>
          </div>
        </nav>

        <div className="post-detail-body">
          {post.excerpt && (
            <aside className="post-ai-summary">
              <h2><Bot aria-hidden="true" />AI摘要</h2>
              <p>{post.excerpt}</p>
              <small>此内容根据文章生成，仅用于文章内容的解释与总结。</small>
            </aside>
          )}
          <MarkdownContent content={post.content} />
          <p className="tags">标签: {post.tags.length ? post.tags.map((tag, index) => <span key={tag.id}>{index > 0 && ", "}<Link href={`/tags/${tag.slug}`}>{tag.name}</Link></span>) : "none"}</p>
        </div>
      </article>
      <ul className="post-near">
        <li>上一篇: {nearby.previous ? <Link href={`/posts/${nearby.previous.slug}`}>{nearby.previous.title}</Link> : "没有了"}</li>
        <li>下一篇: {nearby.next ? <Link href={`/posts/${nearby.next.slug}`}>{nearby.next.title}</Link> : "没有了"}</li>
      </ul>
    </>
  );
}

import Link from "next/link";
import {
  Bot,
  Clock3,
  Eye,
  FolderOpen,
  Home,
  MessageCircle,
  ThumbsUp,
  Share2,
  Star,
  UserRound,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { ArticleToc, PaperTableOfContents } from "@/components/site/article-toc";
import { DonationDialog } from "@/components/site/donation-dialog";
import { Separator } from "@/components/ui/separator";
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
        <ArticleToc />
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
              <div className="post-ai-summary-heading">
                <span className="post-ai-summary-icon"><Bot aria-hidden="true" /></span>
                <strong>AI 摘要</strong>
              </div>
              <p>{post.excerpt}</p>
              <small>此内容根据文章生成，仅用于文章内容的解释与总结。</small>
            </aside>
          )}
          <PaperTableOfContents />
          <MarkdownContent content={post.content} />
          <p className="tags">标签: {post.tags.length ? post.tags.map((tag, index) => <span key={tag.id}>{index > 0 && ", "}<Link href={`/tags/${tag.slug}`}>{tag.name}</Link></span>) : "none"}</p>
          <div className="post-ending">
            <p className="post-reference">代码参考了 <Link href="/">小刘同学</Link> 的文章。</p>
            <div className="post-ending-rule" aria-hidden="true" />
            <section className="post-download" aria-labelledby="post-download-title">
              <h2 id="post-download-title">爱心下载</h2>
              <p>我找了四个爱心svg，有需要的话可以下载使用：</p>
              <div className="post-download-gate">此处内容需要评论回复后（审核通过）方可阅读。</div>
            </section>
            <div className="post-ending-meta">
              <span><Clock3 aria-hidden="true" />最后修改：{formatPostDate(post.updatedAt)}</span>
              <span>© 允许规范转载</span>
            </div>
            <div className="post-support">
              <div className="post-support-actions">
                <DonationDialog />
                <button className="post-support-like" type="button"><ThumbsUp aria-hidden="true" />赞&nbsp;3</button>
              </div>
              <p>如果觉得我的文章对你有用，请随意赞赏</p>
            </div>
            <div className="post-end-marker">
              <Separator className="post-end-separator" aria-hidden="true" />
              <span>END</span>
            </div>
            <dl className="post-attribution">
              <div><dt>本文作者：</dt><dd><Link href="/">管理员</Link></dd></div>
              <div><dt>文章标题：</dt><dd><Link href={`/posts/${post.slug}`}>{post.title}</Link></dd></div>
              <div><dt>本文地址：</dt><dd><Link href={`https://farisni.top/posts/${post.slug}`}>https://farisni.top/posts/{post.slug}</Link></dd></div>
              <div><dt>版权说明：</dt><dd>若无注明，本文皆为 Dust In The Wind 原创，转载请保留文章出处。</dd></div>
            </dl>
          </div>
        </div>
      </article>
      <ul className="post-near">
        <li className="post-near-previous">
          {nearby.previous ? (
            <Link href={`/posts/${nearby.previous.slug}`} aria-label={`上一篇：${nearby.previous.title}`}>
              上一篇
            </Link>
          ) : (
            <span aria-disabled="true">上一篇</span>
          )}
        </li>
        <li className="post-near-next">
          {nearby.next ? (
            <Link href={`/posts/${nearby.next.slug}`} aria-label={`下一篇：${nearby.next.title}`}>
              下一篇
            </Link>
          ) : (
            <span aria-disabled="true">下一篇</span>
          )}
        </li>
      </ul>
    </>
  );
}

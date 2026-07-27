import Link from "next/link";
import {
  Bot,
  ChevronRight,
  Clock3,
  Eye,
  FolderOpen,
  Home,
  MessageCircle,
  Share2,
  Star,
} from "lucide-react";
import { MarkdownContent } from "@/components/markdown/markdown-content";
import { CodeCopyEnhancer } from "@/components/markdown/code-copy-enhancer";
import { PaperTableOfContents } from "@/components/site/article-toc";
import { DonationDialog } from "@/components/site/donation-dialog";
import { PostLikeButton } from "@/components/site/post-like-button";
import { Separator } from "@/components/ui/separator";
import { PostComments } from "@/components/site/post-comments";
import { formatPostDate } from "@/lib/format-date";
import { getAdjacentPosts, getPublishedPostBySlug } from "@/lib/repositories/posts";

export const dynamic = "force-dynamic";

function PostNearArrow({ direction }: { direction: "previous" | "next" }) {
  return (
    <svg
      className={`post-near-arrow post-near-arrow-${direction}`}
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
  );
}

export default async function PostPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ commentPage?: string }>;
}) {
  // App Router 的 [slug] 是动态路由段，params 中的 slug 来自当前 URL。
  const { slug } = await params;
  const post = await getPublishedPostBySlug(slug);
  const { commentPage } = await searchParams;
  const requestedCommentPage = /^\d+$/.test(commentPage ?? "") ? Number(commentPage) : undefined;
  const nearby = post.publishedAt ? getAdjacentPosts(post.publishedAt) : { previous: undefined, next: undefined };

  return (
    <>
      <article className="post post-detail">
        <header className="post-detail-header">
          <div className="post-detail-header-content">
            <h1 className="post-title"><Link href={`/posts/${post.slug}`}>{post.title}</Link></h1>
            <ul className="post-meta">
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
                <Link href="#comments">{post.commentCount ? `${post.commentCount} 条评论` : "暂无评论"}</Link>
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
            <Link href="/">
              <Home aria-hidden="true" />
              <span>首页</span>
            </Link>
            <ChevronRight className="lite-breadcrumb-separator" aria-hidden="true" />
            <span aria-current="page">正文</span>
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
          {post.renderedContent ? (
            <div
              className="markdown-body post-content"
              dangerouslySetInnerHTML={{ __html: post.renderedContent }}
            />
          ) : (
            <MarkdownContent content={post.content} />
          )}
          <CodeCopyEnhancer />
          <p className="tags">标签: {post.tags.length ? post.tags.map((tag, index) => <span key={tag.id}>{index > 0 && ", "}<Link href={`/tags/${tag.slug}`}>{tag.name}</Link></span>) : "none"}</p>
          <div className="post-ending">
            <p className="post-reference" hidden>代码参考了 <Link href="/">小刘同学</Link> 的文章。</p>
            <div className="post-ending-rule" aria-hidden="true" />
            <section className="post-download" aria-labelledby="post-download-title" hidden>
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
                <PostLikeButton />
              </div>
              <p>如果觉得我的文章对你有用，请随意赞赏</p>
            </div>
            <div className="post-end-marker">
              <Separator className="post-end-separator" aria-hidden="true" />
              <span>END</span>
            </div>
            <dl className="post-attribution">
              <div><dt>本文作者：</dt><dd><Link href="/">faris</Link></dd></div>
              <div><dt>文章标题：</dt><dd><Link href={`/posts/${post.slug}`}>{post.title}</Link></dd></div>
              <div><dt>本文地址：</dt><dd><Link href={`https://farisni.com/posts/${post.slug}`}>https://farisni.com/posts/{post.slug}</Link></dd></div>
              <div><dt>版权说明：</dt><dd>若无注明，本文皆为 Dust In The Wind 原创，转载请保留文章出处。</dd></div>
            </dl>
          </div>
        </div>
      </article>
      <ul className="post-near">
        <li className="post-near-previous">
          {nearby.previous ? (
            <Link href={`/posts/${nearby.previous.slug}`} aria-label={`上一篇：${nearby.previous.title}`}>
              <PostNearArrow direction="previous" />
              上一篇
            </Link>
          ) : (
            <span aria-disabled="true">
              <PostNearArrow direction="previous" />
              上一篇
            </span>
          )}
        </li>
        <li className="post-near-next">
          {nearby.next ? (
            <Link href={`/posts/${nearby.next.slug}`} aria-label={`下一篇：${nearby.next.title}`}>
              下一篇
              <PostNearArrow direction="next" />
            </Link>
          ) : (
            <span aria-disabled="true">
              下一篇
              <PostNearArrow direction="next" />
            </span>
          )}
        </li>
      </ul>
      <PostComments post={post} page={requestedCommentPage} />
    </>
  );
}

"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import { ImagePlus, MessageCircle, Reply, SmilePlus, X } from "lucide-react";
import {
  submitComment,
  type CommentActionState,
} from "@/actions/comments";
import type { PublicComment } from "@/lib/repositories/comments";

type CommentsClientProps = {
  postId: string;
  postSlug: string;
  comments: PublicComment[];
  approvedCount: number;
  page: number;
  totalPages: number;
  commentsOpen: boolean;
  currentUser: { displayName: string } | null;
  remembered: { author: string; mail: string; url: string };
  settings: {
    threaded: boolean;
    maxNestingLevels: number;
    markdown: boolean;
    showUrl: boolean;
    urlNofollow: boolean;
    avatar: boolean;
    requireMail: boolean;
    requireUrl: boolean;
  };
};

const initialState: CommentActionState = { ok: false, message: "" };
const INITIAL_VISIBLE_COMMENTS = 10;

function countCommentTree(comments: PublicComment[]): number {
  return comments.reduce(
    (total, comment) => total + 1 + countCommentTree(comment.children),
    0,
  );
}

function limitCommentTree(
  comments: PublicComment[],
  limit: number,
): { comments: PublicComment[]; count: number } {
  const visibleComments: PublicComment[] = [];
  let count = 0;

  for (const comment of comments) {
    if (count >= limit) break;

    count += 1;
    const visibleChildren = limitCommentTree(
      comment.children,
      Math.max(0, limit - count),
    );
    count += visibleChildren.count;
    visibleComments.push({
      ...comment,
      children: visibleChildren.comments,
    });
  }

  return { comments: visibleComments, count };
}

function CommentBody({ text, markdown }: { text: string; markdown: boolean }) {
  if (!markdown) return <p className="comment-plain-text">{text}</p>;
  return (
    <div className="comment-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {text}
      </ReactMarkdown>
    </div>
  );
}

function CommentItem({
  comment,
  depth,
  settings,
  commentsOpen,
  onReply,
  replyToId,
  replyEditor,
}: {
  comment: PublicComment;
  depth: number;
  settings: CommentsClientProps["settings"];
  commentsOpen: boolean;
  onReply: (comment: PublicComment) => void;
  replyToId: string | null;
  replyEditor: ReactNode;
}) {
  const [repliesOpen, setRepliesOpen] = useState(true);
  const author = settings.showUrl && comment.url
    ? (
        <a
          href={comment.url}
          rel={settings.urlNofollow ? "nofollow ugc noopener noreferrer" : "ugc noopener noreferrer"}
          target="_blank"
        >
          {comment.author}
        </a>
      )
    : <span>{comment.author}</span>;

  return (
    <li
      id={`comment-${comment.id}`}
      className={`comment-item${comment.isOwner ? " comment-by-owner" : ""}`}
      style={{ "--comment-depth": Math.min(depth, settings.maxNestingLevels - 1) } as CSSProperties}
    >
      <article>
        {settings.avatar && (
          // eslint-disable-next-line @next/next/no-img-element
          <img className="comment-avatar" src={comment.avatarUrl} alt="" width={48} height={48} loading="lazy" />
        )}
        <div className="comment-main">
          <header className="comment-meta">
            <strong>{author}</strong>
            {comment.isOwner && <span className="comment-owner-badge">博主</span>}
            {comment.status === "waiting" && <span className="comment-waiting-badge">等待审核</span>}
            {comment.replyToAuthor && (
              <span className="comment-reply-target">回复 @{comment.replyToAuthor}</span>
            )}
            <time>{comment.createdLabel}</time>
          </header>
          <CommentBody text={comment.text} markdown={settings.markdown} />
          {commentsOpen && settings.threaded && comment.status === "approved" && (
            <button className="comment-reply-button" type="button" title={`回复 ${comment.author}`} onClick={() => onReply(comment)}>
              <Reply aria-hidden="true" />
              回复
            </button>
          )}
        </div>
      </article>
      {replyToId === comment.id && (
        <div className="comment-inline-respond">
          {replyEditor}
        </div>
      )}
      {comment.children.length > 0 && (
        <>
          <button
            className="comment-replies-toggle"
            type="button"
            aria-expanded={repliesOpen}
            onClick={() => setRepliesOpen((open) => !open)}
          >
            {repliesOpen ? "收起回复" : `查看 ${comment.children.length} 条回复`}
          </button>
          {repliesOpen && (
            <ol className="comment-children">
              {comment.children.map((child) => (
                <CommentItem
                  key={child.id}
                  comment={child}
                  depth={depth + 1}
                  settings={settings}
                  commentsOpen={commentsOpen}
                  onReply={onReply}
                  replyToId={replyToId}
                  replyEditor={replyEditor}
                />
              ))}
            </ol>
          )}
        </>
      )}
    </li>
  );
}

export function CommentsClient(props: CommentsClientProps) {
  const [replyTo, setReplyTo] = useState<PublicComment | null>(null);
  const [commentBoxOpen, setCommentBoxOpen] = useState(props.commentsOpen);
  const [allCommentsVisible, setAllCommentsVisible] = useState(false);
  const [state, formAction, pending] = useActionState(submitComment, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const totalCommentCount = countCommentTree(props.comments);
  const visibleComments = allCommentsVisible
    ? props.comments
    : limitCommentTree(props.comments, INITIAL_VISIBLE_COMMENTS).comments;
  const hiddenCommentCount = Math.max(
    0,
    totalCommentCount - INITIAL_VISIBLE_COMMENTS,
  );

  useEffect(() => {
    if (!state.ok || !state.revision) return;
    formRef.current?.reset();
    setReplyTo(null);
    router.refresh();
  }, [router, state.ok, state.revision]);

  function beginReply(comment: PublicComment) {
    setCommentBoxOpen(true);
    setReplyTo(comment);
    requestAnimationFrame(() => {
      document.getElementById("comment-text")?.focus();
    });
  }

  function insertIntoComment(value: string) {
    const textarea = document.getElementById("comment-text") as HTMLTextAreaElement | null;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    textarea.setRangeText(value, start, end, "end");
    textarea.focus();
  }

  function insertCommentImage() {
    const url = window.prompt("请输入图片地址");
    if (!url?.trim()) return;
    insertIntoComment(props.settings.markdown ? `![图片](${url.trim()})` : url.trim());
  }

  const replyEditor = props.commentsOpen && commentBoxOpen ? (
    <div id="respond" className={`comment-respond${replyTo ? " comment-respond-inline" : ""}`}>
      <div className="comment-respond-title">
        <h3>{replyTo ? `回复 @${replyTo.author}` : "添加新评论"}</h3>
      </div>
      <form ref={formRef} action={formAction}>
        <input type="hidden" name="postId" value={props.postId} />
        <input type="hidden" name="postSlug" value={props.postSlug} />
        <input type="hidden" name="parentId" value={replyTo?.id ?? ""} />
        <div className="comment-honeypot" aria-hidden="true">
          <label htmlFor="comment-company">公司</label>
          <input id="comment-company" name="company" type="text" tabIndex={-1} autoComplete="off" />
        </div>

        <button
          className="comment-close-button"
          type="button"
          aria-label="关闭评论框"
          title="关闭评论框"
          onClick={() => {
            setReplyTo(null);
            setCommentBoxOpen(false);
          }}
        >
          <X aria-hidden="true" />
        </button>

        {props.currentUser ? (
          <p className="comment-login-identity">
            登录身份：<strong>{props.currentUser.displayName}</strong>
          </p>
        ) : (
          <div className="comment-visitor-fields">
            <label data-required="true">
              <span className="sr-only">昵称</span>
              <input name="author" defaultValue={props.remembered.author} required maxLength={150} placeholder="昵称 *" />
            </label>
            <label data-required={props.settings.requireMail || undefined}>
              <span className="sr-only">邮箱</span>
              <input name="mail" type="email" defaultValue={props.remembered.mail} required={props.settings.requireMail} maxLength={150} placeholder={props.settings.requireMail ? "邮箱 *" : "邮箱"} />
            </label>
            <label data-required={props.settings.requireUrl || undefined}>
              <span className="sr-only">网址</span>
              <input name="url" type="text" defaultValue={props.remembered.url} required={props.settings.requireUrl} maxLength={255} placeholder={props.settings.requireUrl ? "网址 *" : "网址（可选）"} />
            </label>
          </div>
        )}

        <label className="comment-text-field" htmlFor="comment-text">
          <span className="sr-only">评论内容</span>
          <textarea
            id="comment-text"
            name="text"
            rows={5}
            required
            maxLength={10000}
            placeholder={replyTo ? `@${replyTo.author}` : "欢迎评论"}
          />
        </label>
        <div className="comment-editor-tools" aria-label="评论编辑工具">
          <button type="button" title="插入表情" aria-label="插入表情" onClick={() => insertIntoComment("🙂")}>
            <SmilePlus aria-hidden="true" />
          </button>
          <button type="button" title="插入图片" aria-label="插入图片" onClick={insertCommentImage}>
            <ImagePlus aria-hidden="true" />
          </button>
          {props.settings.markdown && <span className="sr-only">支持 Markdown 语法</span>}
        </div>
        {state.message && !state.ok && (
          <p className={`comment-form-message ${state.ok ? "success" : "error"}`} role="status">
            {state.message}
          </p>
        )}
        <div className="comment-form-actions">
          {!props.currentUser && (
            <Link className="comment-login-link" href={`/login?referer=${encodeURIComponent(`/posts/${props.postSlug}#comments`)}`}>
              登录
            </Link>
          )}
          <button className="comment-submit" type="submit" disabled={pending}>
            {pending ? "正在提交..." : "提交"}
          </button>
        </div>
      </form>
    </div>
  ) : null;

  return (
    <section id="comments" className="post-comments" aria-labelledby="comments-title">
      <div className="comments-heading">
        <MessageCircle aria-hidden="true" />
        <h2 id="comments-title">
          {props.approvedCount} 评论
        </h2>
      </div>

      {props.comments.length > 0 && (
        <ol className="comment-list">
          {visibleComments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              depth={0}
              settings={props.settings}
              commentsOpen={props.commentsOpen}
              onReply={beginReply}
              replyToId={replyTo?.id ?? null}
              replyEditor={replyEditor}
            />
          ))}
        </ol>
      )}

      {hiddenCommentCount > 0 && (
        <button
          type="button"
          className="comment-list-toggle"
          aria-expanded={allCommentsVisible}
          onClick={() => setAllCommentsVisible((visible) => !visible)}
        >
          {allCommentsVisible
            ? "收起评论"
            : `查看更多（${hiddenCommentCount}）`}
        </button>
      )}

      {props.totalPages > 1 && (
        <nav className="comment-pagination" aria-label="评论分页">
          {Array.from({ length: props.totalPages }, (_, index) => index + 1).map((page) => (
            <Link
              key={page}
              href={`/posts/${props.postSlug}?commentPage=${page}#comments`}
              aria-current={page === props.page ? "page" : undefined}
            >
              {page}
            </Link>
          ))}
        </nav>
      )}

      {props.commentsOpen ? (
        commentBoxOpen ? (
          !replyTo && replyEditor
        ) : (
          <button className="comment-open-button" type="button" onClick={() => setCommentBoxOpen(true)}>
            写评论
          </button>
        )
      ) : (
        <p className="comments-closed">评论已关闭</p>
      )}
    </section>
  );
}

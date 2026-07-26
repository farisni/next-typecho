import { cookies } from "next/headers";
import { getCurrentUser } from "@/lib/auth/session";
import { listCommentsForPost } from "@/lib/repositories/comments";
import { CommentsClient } from "@/components/site/comments-client";

type PostCommentsProps = {
  post: {
    id: string;
    slug: string;
    allowComment: boolean;
    publishedAt: Date | null;
  };
  page?: number;
};

export async function PostComments({ post, page }: PostCommentsProps) {
  const cookieStore = await cookies();
  const pendingCommentId = cookieStore.get("__typecho_unapproved_comment")?.value;
  const [currentUser, comments] = await Promise.all([
    getCurrentUser(),
    Promise.resolve(listCommentsForPost(post.id, page, pendingCommentId)),
  ]);
  const autoClosed = Boolean(
    comments.settings.commentsAutoCloseDays > 0 &&
    post.publishedAt &&
    Date.now() - post.publishedAt.getTime() >
      comments.settings.commentsAutoCloseDays * 86400000,
  );

  return (
    <CommentsClient
      postId={post.id}
      postSlug={post.slug}
      comments={comments.items}
      approvedCount={comments.approvedCount}
      page={comments.page}
      totalPages={comments.totalPages}
      commentsOpen={post.allowComment && !autoClosed}
      currentUser={currentUser ? { displayName: currentUser.displayName } : null}
      remembered={{
        author: cookieStore.get("__typecho_remember_author")?.value ?? "",
        mail: cookieStore.get("__typecho_remember_mail")?.value ?? "",
        url: cookieStore.get("__typecho_remember_url")?.value ?? "",
      }}
      settings={{
        threaded: comments.settings.commentsThreaded,
        maxNestingLevels: comments.settings.commentsMaxNestingLevels,
        markdown: comments.settings.commentsMarkdown,
        showUrl: comments.settings.commentsShowUrl,
        urlNofollow: comments.settings.commentsUrlNofollow,
        avatar: comments.settings.commentsAvatar,
        requireMail: comments.settings.commentsRequireMail,
        requireUrl: comments.settings.commentsRequireUrl,
      }}
    />
  );
}

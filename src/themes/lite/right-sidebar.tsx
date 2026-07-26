import { getSidebarContent } from "@/lib/repositories/posts";
import { listLatestComments } from "@/lib/repositories/comments";
import { ArticleToc } from "@/components/site/article-toc";
import type { LiteThemeConfig } from "@/themes/lite/definition";
import { PopularPostsWidget } from "@/themes/lite/widgets/popular-posts-widget";

export function RightSidebar({
  description,
  config,
}: {
  description: string;
  config: LiteThemeConfig;
}) {
  const { recentPosts } = getSidebarContent();
  const latestComments = listLatestComments(5);
  const posts = recentPosts.map((post) => ({
    title: post.title,
    slug: post.slug,
    commentCount: Number(post.commentCount),
  }));
  void description;
  void config;

  return (
    <aside className="handsome-right-sidebar" aria-label="博客信息">
      <PopularPostsWidget posts={posts} comments={latestComments} />
      <ArticleToc />
    </aside>
  );
}

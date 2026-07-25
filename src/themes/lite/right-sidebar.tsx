import { getSidebarContent } from "@/lib/repositories/posts";
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
  void description;
  void config;

  return (
    <aside className="handsome-right-sidebar" aria-label="博客信息">
      <PopularPostsWidget posts={recentPosts} />
    </aside>
  );
}

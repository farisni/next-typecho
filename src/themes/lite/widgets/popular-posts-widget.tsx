import type { LatestComment } from "@/lib/repositories/comments";
import { SidebarTabsClient } from "@/themes/lite/widgets/sidebar-tabs-client";

type PopularPost = {
  title: string;
  slug: string;
  commentCount: number;
};

export function PopularPostsWidget({
  posts,
  comments,
}: {
  posts: PopularPost[];
  comments: LatestComment[];
}) {
  return (
    <section className="handsome-popular-widget" aria-label="侧栏内容">
      <SidebarTabsClient posts={posts} comments={comments} />
    </section>
  );
}

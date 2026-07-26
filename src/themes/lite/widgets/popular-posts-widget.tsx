import Link from "next/link";
import { SidebarTabsClient } from "@/themes/lite/widgets/sidebar-tabs-client";

type PopularPost = {
  title: string;
  slug: string;
  commentCount: number;
};

export function PopularPostsWidget({ posts }: { posts: PopularPost[] }) {
  return (
    <section className="handsome-popular-widget" aria-label="热门文章">
      <SidebarTabsClient />
      <ul className="handsome-popular-list">
        {posts.slice(0, 5).map((post, index) => (
          <li key={post.slug}>
            <span className="lite-post-rank" aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
            <div className="lite-popular-copy">
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

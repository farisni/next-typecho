import Link from "next/link";
import { MessageCircle, Newspaper } from "lucide-react";
import { SidebarTabsClient } from "@/themes/handsome/widgets/sidebar-tabs-client";

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
        {posts.slice(0, 5).map((post) => (
          <li key={post.slug}>
            <span className="handsome-post-thumb" aria-hidden="true">
              <Newspaper />
            </span>
            <div>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              <span className="handsome-post-comments">
                <MessageCircle aria-hidden="true" />
                {post.commentCount}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

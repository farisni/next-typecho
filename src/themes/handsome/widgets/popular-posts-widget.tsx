import Link from "next/link";
import { MessageCircle, Newspaper } from "lucide-react";
import { SidebarTabs } from "@/themes/handsome/widgets/sidebar-tabs";

type PopularPost = {
  title: string;
  slug: string;
};

const commentCounts = [523, 212, 202, 196, 179];

export function PopularPostsWidget({ posts }: { posts: PopularPost[] }) {
  return (
    <section className="handsome-popular-widget" aria-label="热门文章">
      <SidebarTabs />
      <ul className="handsome-popular-list">
        {posts.slice(0, 5).map((post, index) => (
          <li key={post.slug}>
            <span className="handsome-post-thumb" aria-hidden="true">
              <Newspaper />
            </span>
            <div>
              <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              <span className="handsome-post-comments">
                <MessageCircle aria-hidden="true" />
                {commentCounts[index] ?? 0}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

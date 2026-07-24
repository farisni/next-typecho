import Link from "next/link";
import {
  CalendarDays,
  FolderOpen,
  UserRound,
} from "lucide-react";
import { getSidebarContent } from "@/lib/repositories/posts";
import type { HandsomeThemeConfig } from "@/themes/handsome/definition";
import { PopularPostsWidget } from "@/themes/handsome/widgets/popular-posts-widget";
import { RealtimeQpsWidget } from "@/themes/handsome/widgets/realtime-qps-widget";

export function RightSidebar({
  description,
  config,
}: {
  description: string;
  config: HandsomeThemeConfig;
}) {
  const { recentPosts, categories, archives } = getSidebarContent();
  const blocks = new Set(config.rightSidebarBlocks);

  return (
    <aside className="handsome-right-sidebar" aria-label="博客信息">
      {blocks.has("RecentPosts") && <PopularPostsWidget posts={recentPosts} />}

      <RealtimeQpsWidget />

      {blocks.has("Profile") && (
        <section className="handsome-panel handsome-profile-panel">
          <span className="handsome-panel-icon"><UserRound aria-hidden="true" /></span>
          <h2>关于博客</h2>
          <p>{description}</p>
        </section>
      )}

      {blocks.has("Categories") && (
        <section className="handsome-panel">
          <h2><FolderOpen aria-hidden="true" />分类</h2>
          <ul>
            {categories.map((category) => (
              <li key={category.slug}>
                <Link href={`/categories/${category.slug}`}>{category.name}</Link>
                <span>{category.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {blocks.has("Archives") && (
        <section className="handsome-panel">
          <h2><CalendarDays aria-hidden="true" />归档</h2>
          <ul>
            {archives.map((archive) => (
              <li key={archive.month}>
                <Link href="/">{archive.month}</Link>
                <span>{archive.count}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}

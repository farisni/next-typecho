import Link from "next/link";
import { logoutFromSite } from "@/actions/auth";
import type { AuthUser } from "@/lib/auth/session";
import { getSidebarContent } from "@/lib/repositories/posts";
import type { DefaultThemeConfig } from "@/lib/themes/registry";

export function SiteSidebar({ user, config }: { user: AuthUser | null; config: DefaultThemeConfig }) {
  const { recentPosts, categories, archives } = getSidebarContent();
  const blocks = new Set(config.sidebarBlocks);

  return (
    <aside id="secondary" aria-label="侧边栏">
      {blocks.has("ShowRecentPosts") && <section className="widget">
        <h3 className="widget-title">最新文章</h3>
        <ul className="widget-list">
          {recentPosts.map((post) => <li key={post.slug}><Link href={`/posts/${post.slug}`}>{post.title}</Link></li>)}
        </ul>
      </section>}
      {blocks.has("ShowRecentComments") && <section className="widget">
        <h3 className="widget-title">最近回复</h3>
        <ul className="widget-list" />
      </section>}
      {blocks.has("ShowCategory") && <section className="widget">
        <h3 className="widget-title">分类</h3>
        <ul className="widget-list">
          {categories.map((category) => <li key={category.slug}><Link href={`/categories/${category.slug}`}>{category.name}</Link> ({category.count})</li>)}
        </ul>
      </section>}
      {blocks.has("ShowArchive") && <section className="widget">
        <h3 className="widget-title">归档</h3>
        <ul className="widget-list">
          {archives.map((archive) => <li key={archive.month}><Link href="/">{archive.month}</Link> ({archive.count})</li>)}
        </ul>
      </section>}
      {blocks.has("ShowOther") && <section className="widget">
        <h3 className="widget-title">其它</h3>
        <ul className="widget-list">
          {user ? (
            <>
              <li className="last"><Link href="/admin">进入后台 ({user.displayName})</Link></li>
              <li>
                <form action={logoutFromSite} className="site-logout-form">
                  <button type="submit" className="site-logout-button">退出</button>
                </form>
              </li>
            </>
          ) : (
            <li className="last"><Link href="/login">登录</Link></li>
          )}
          <li><a href="https://typecho.org">Typecho</a></li>
        </ul>
      </section>}
    </aside>
  );
}

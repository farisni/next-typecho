import Link from "next/link";
import { GitFork, Search, Sun } from "lucide-react";
import { listPublishedPosts } from "@/lib/repositories/posts";
import type { PaperThemeConfig } from "@/themes/paper/definition";
import type { ThemeLayoutProps } from "@/themes/types";

function formatPaperDate(date: Date | null) {
  if (!date) return "-- --- ----";
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export function PaperThemeLayout({
  name,
  description,
  config,
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<PaperThemeConfig>) {
  const pinnedPosts = listPublishedPosts(1, 2).items;

  return (
    <div className={`theme-paper paper-accent-${config.accentColor}`}>
      {customStyle}
      {previewBar}

      <header className="paper-header">
        <div className="paper-brand-row">
          <Link className="paper-brand" href="/">
            <span className="paper-logo" aria-hidden="true">P</span>
            <strong>{name}</strong>
          </Link>
          <div className="paper-header-actions">
            <Link href="/?q=" aria-label="搜索文章"><Search aria-hidden="true" /></Link>
            <button type="button" aria-label="切换明暗主题"><Sun aria-hidden="true" /></button>
          </div>
        </div>
        <nav className="paper-nav" aria-label="站点导航">
          <Link href="/">Home</Link>
          <Link href="/start-page.html">About</Link>
          <Link href="/">Blog</Link>
          <Link href="/feed.xml">Notes</Link>
        </nav>
      </header>

      <main className="paper-main">
        <section className="paper-intro">
          <h1>Hello World!</h1>
          <p>{description}</p>
          <span className="paper-find-me">
            Find me on
            <a href="https://github.com/farisni/next-typecho" aria-label="GitHub">
              <GitFork aria-hidden="true" />
            </a>
          </span>
        </section>

        <section className="paper-pinned" aria-labelledby="paper-pinned-title">
          <h2 id="paper-pinned-title">Pinned Posts</h2>
          <ul>
            {pinnedPosts.map((post) => (
              <li key={post.slug}>
                <time>{formatPaperDate(post.publishedAt)}</time>
                <Link href={`/posts/${post.slug}`}>{post.title}</Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="paper-posts" aria-labelledby="paper-posts-title">
          <h2 id="paper-posts-title" className="paper-section-title">Posts</h2>
          <div className="paper-post-list">{children}</div>
        </section>
      </main>

      <footer className="paper-footer">
        <span>© {new Date().getFullYear()} {name}.</span>
        <nav aria-label="页脚导航">
          <Link href="/">Home</Link>
          <Link href="/start-page.html">About</Link>
          <Link href="/feed.xml">RSS</Link>
        </nav>
      </footer>
    </div>
  );
}

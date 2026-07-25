import Link from "next/link";
import { Search } from "lucide-react";
import { listPublishedPosts } from "@/lib/repositories/posts";
import type { PaperThemeConfig } from "@/themes/paper/definition";
import { PaperThemeToggle } from "@/themes/paper/theme-toggle";
import type { ThemeLayoutProps } from "@/themes/types";

function formatPaperDate(date: Date | null) {
  if (!date) return "-- --- ----";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
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
            <svg
              aria-hidden="true"
              className="paper-logo"
              fill="none"
              focusable="false"
              viewBox="0 0 272 480"
            >
              <path
                fill="#cdffb8"
                d="M181.334 93.333v-40L226.667 80v40zM136.001 53.333 90.667 26.667v426.666L136.001 480zM45.333 220 0 193.334v140L45.333 360z"
              />
              <path
                fill="#d482ab"
                d="M90.667 26.667 136.001 0l45.333 26.667-45.333 26.666zM181.334 53.33l45.333-26.72L272 53.33 226.667 80zM136 240l-45.333-26.67v53.34zM0 193.33l45.333-26.72 45.334 26.72L45.333 220zM181.334 93.277 226.667 120l-45.333 26.67z"
              />
              <path
                fill="#2abc89"
                d="m136 53.333 45.333-26.666v120L226.667 120V80L272 53.333V160l-90.667 53.333v240L136 480V306.667L45.334 360V220l45.333-26.667v73.334L136 240z"
              />
            </svg>
            <strong>{name}</strong>
          </Link>
          <div className="paper-header-actions">
            <Link href="/?q=" aria-label="搜索文章"><Search aria-hidden="true" /></Link>
            <PaperThemeToggle />
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
              <svg aria-hidden="true" className="paper-github-mark" viewBox="0 0 24 24">
                <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.4c.58.1.79-.25.79-.56v-2.23c-3.22.7-3.9-1.37-3.9-1.37-.52-1.34-1.28-1.7-1.28-1.7-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.29-5.27-1.29-5.27-5.73 0-1.27.45-2.3 1.19-3.11-.12-.29-.52-1.47.11-3.07 0 0 .97-.31 3.16 1.19a10.97 10.97 0 0 1 5.76 0c2.19-1.5 3.16-1.19 3.16-1.19.63 1.6.23 2.78.11 3.07.74.81 1.19 1.84 1.19 3.11 0 4.45-2.71 5.43-5.29 5.72.42.36.79 1.06.79 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .7Z" />
              </svg>
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

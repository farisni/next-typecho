import type { Metadata } from "next";
import Link from "next/link";
import { getSidebarContent, listAllPublishedPosts } from "@/lib/repositories/posts";
import { getSiteSettings } from "@/lib/repositories/settings";
import styles from "./sitemap.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "站点地图",
  description: "浏览本站文章、分类与独立页面。",
};

const independentPages = [
  { href: "/", label: "首页" },
  { href: "/posts", label: "文章归档" },
  { href: "/start-page.html", label: "关于" },
  { href: "/sitemap.html", label: "站点地图" },
];

function formatDate(date: Date | null) {
  if (!date) return "";
  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Shanghai",
  }).format(date);
}

export default async function SitemapPage() {
  const settings = await getSiteSettings();
  const posts = listAllPublishedPosts();
  const { categories } = getSidebarContent();

  return (
    <article className={styles.sitemapPage}>
      <header className={styles.heading}>
        <p>Site index</p>
        <h1>{settings.siteName} 的站点地图</h1>
        <span>{posts.length} 篇文章 · {categories.length} 个分类</span>
      </header>

      <nav className={styles.breadcrumb} aria-label="面包屑">
        <Link href="/">{settings.siteName}</Link>
        <span aria-hidden="true">›</span>
        <span>站点地图</span>
      </nav>

      <div className={styles.directory}>
        <section className={styles.section} aria-labelledby="sitemap-posts-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>01</span>
              <h2 id="sitemap-posts-title">最新文章</h2>
            </div>
            <small>按发布时间排序</small>
          </div>

          {posts.length ? (
            <ol className={styles.postList}>
              {posts.map((post) => (
                <li key={post.id}>
                  <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  <time dateTime={post.publishedAt?.toISOString()}>
                    {formatDate(post.publishedAt)}
                  </time>
                </li>
              ))}
            </ol>
          ) : (
            <p className={styles.empty}>暂时还没有已发布文章。</p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="sitemap-categories-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>02</span>
              <h2 id="sitemap-categories-title">分类目录</h2>
            </div>
            <small>{categories.length} 个分类</small>
          </div>

          {categories.length ? (
            <ul className={styles.categoryList}>
              {categories.map((category) => (
                <li key={category.slug}>
                  <Link href={`/categories/${category.slug}`}>
                    <span>{category.name}</span>
                    <small>{category.count}</small>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className={styles.empty}>暂时还没有分类。</p>
          )}
        </section>

        <section className={styles.section} aria-labelledby="sitemap-pages-title">
          <div className={styles.sectionHeading}>
            <div>
              <span>03</span>
              <h2 id="sitemap-pages-title">独立页面</h2>
            </div>
            <small>快速导航</small>
          </div>

          <ul className={styles.pageList}>
            {independentPages.map((page) => (
              <li key={page.href}>
                <Link href={page.href}>
                  <span>{page.label}</span>
                  <span aria-hidden="true">↗</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <footer className={styles.pageFooter}>
        <span>查看博客首页</span>
        <Link href="/">{settings.siteName}<span aria-hidden="true"> →</span></Link>
      </footer>
    </article>
  );
}

import Link from "next/link";
import { listAllPublishedPosts } from "@/lib/repositories/posts";
import { listTaxonomies } from "@/lib/repositories/taxonomies";

export const dynamic = "force-dynamic";

function formatPaperDate(date: Date | null) {
  if (!date) return { day: "--", month: "---", year: "----" };
  const parts = new Intl.DateTimeFormat("zh-CN", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    timeZone: "Asia/Shanghai",
  }).formatToParts(date);
  const value = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  const month = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"][Number(value("month")) - 1];
  return { day: value("day"), month, year: value("year") };
}

function PaperDate({ date }: { date: Date | null }) {
  const formatted = formatPaperDate(date);
  return <time><span>{formatted.day}</span> <span className="paper-date-month">{formatted.month}</span> <span>{formatted.year}</span></time>;
}

function groupPostsByYear(posts: ReturnType<typeof listAllPublishedPosts>) {
  return posts.reduce<Map<string, typeof posts>>((groups, post) => {
    const year = post.publishedAt
      ? new Intl.DateTimeFormat("en-US", { year: "numeric", timeZone: "Asia/Shanghai" }).format(post.publishedAt)
      : "未归档";
    const yearPosts = groups.get(year) ?? [];
    yearPosts.push(post);
    groups.set(year, yearPosts);
    return groups;
  }, new Map());
}

function TagIcon() {
  return (
    <svg aria-hidden="true" className="paper-archive-tag-icon" viewBox="0 0 24 24" fill="none">
      <path d="m20.59 13.41-7.18 7.18a2 2 0 0 1-2.82 0L3.41 13.4a2 2 0 0 1 0-2.82l7.17-7.17A2 2 0 0 1 12 2.83H19a2 2 0 0 1 2 2V12a2 2 0 0 1-.41 1.41Z" />
      <circle cx="16.5" cy="7.5" r="1" />
    </svg>
  );
}

export default async function PostsPage() {
  const [posts, taxonomies] = await Promise.all([listAllPublishedPosts(), listTaxonomies()]);
  const archivePosts = groupPostsByYear(posts);

  return (
    <div className="paper-archive">
      <header className="paper-archive-heading">
        <h1>归档</h1>
      </header>

      <div className="paper-archive-grid">
        <div className="paper-archive-list">
          {Array.from(archivePosts.entries()).map(([year, yearPosts]) => (
            <section className="paper-archive-year" key={year} aria-labelledby={`paper-archive-year-${year}`}>
              <h2 id={`paper-archive-year-${year}`}>{year}</h2>
              <ul>
                {yearPosts.map((post) => (
                  <li key={post.slug}>
                    <PaperDate date={post.publishedAt} />
                    <Link href={`/posts/${post.slug}`}>{post.title}</Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <aside className="paper-archive-tags" aria-labelledby="paper-archive-tags-title">
          <h2 id="paper-archive-tags-title"><TagIcon />Tags</h2>
          <div>
            {taxonomies.tags.map((tag) => <Link key={tag.id} href={`/tags/${tag.slug}`}>#{tag.name}</Link>)}
          </div>
          <Link className="paper-archive-view-all" href="/posts">View all <span aria-hidden="true">→</span></Link>
        </aside>
      </div>
    </div>
  );
}

import Link from "next/link";
import type { CSSProperties } from "react";
import type { TagDirectoryItem } from "@/lib/repositories/taxonomies";

type TagsPageProps = {
  tags: TagDirectoryItem[];
  postCount: number;
};

function tagScale(postCount: number) {
  if (postCount >= 18) return "2.6rem";
  if (postCount >= 16) return "2.49rem";
  if (postCount >= 8) return "1.96rem";
  if (postCount >= 6) return "1.78rem";
  if (postCount >= 5) return "1.67rem";
  if (postCount >= 4) return "1.56rem";
  if (postCount >= 3) return "1.45rem";
  if (postCount >= 2) return "1.34rem";
  return "1.23rem";
}

export function TagsPage({ tags, postCount }: TagsPageProps) {
  return (
    <section className="lite-tags-page" aria-labelledby="lite-tags-title">
      <header className="lite-tags-header">
        <h1 id="lite-tags-title">Tags</h1>
        <div className="lite-tags-stats" aria-label="标签统计">
          <span><strong>{tags.length}</strong> tags</span>
          <span><strong>{postCount}</strong> posts</span>
        </div>
      </header>

      <div className="lite-tags-cloud" aria-label="标签云">
        {tags.map((tag, tagIndex) => (
          <Link
            key={tag.id}
            href={`/tags/${tag.slug}`}
            className={`lite-tag-chip color-${tagIndex % 8}`}
            style={{ "--lite-tag-size": tagScale(tag.postCount) } as CSSProperties}
          >
            <span>{tag.name}</span>
            <small>{tag.postCount}</small>
          </Link>
        ))}
      </div>
    </section>
  );
}

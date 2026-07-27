"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
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

function CloudIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M7.5 18h9a4.5 4.5 0 0 0 .8-8.93A6 6 0 0 0 5.7 7.3 4 4 0 0 0 7.5 18Z" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none">
      <path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01" />
    </svg>
  );
}

export function TagsPage({ tags, postCount }: TagsPageProps) {
  const [view, setView] = useState<"cloud" | "list">("cloud");

  return (
    <section className="lite-tags-page" aria-labelledby="lite-tags-title">
      <header className="lite-tags-header">
        <h1 id="lite-tags-title">Tags</h1>
        <p>Browse posts by topic.</p>
        <div className="lite-tags-stats" aria-label="标签统计">
          <span><strong>{tags.length}</strong> tags</span>
          <span><strong>{postCount}</strong> posts</span>
        </div>
      </header>

      <div className="lite-tags-tabs" role="tablist" aria-label="标签显示方式">
        <button
          type="button"
          role="tab"
          aria-selected={view === "cloud"}
          className={view === "cloud" ? "is-active" : ""}
          onClick={() => setView("cloud")}
        >
          <CloudIcon />
          Cloud
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={view === "list"}
          className={view === "list" ? "is-active" : ""}
          onClick={() => setView("list")}
        >
          <ListIcon />
          List
        </button>
      </div>

      {view === "cloud" ? (
        <div className="lite-tags-cloud" role="tabpanel" aria-label="标签云">
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
      ) : (
        <div className="lite-tags-list" role="tabpanel" aria-label="标签列表">
          {tags.map((tag, tagIndex) => (
            <Link key={tag.id} href={`/tags/${tag.slug}`}>
              <span>{tag.name}</span>
              <small>{tag.postCount}</small>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";

type TocItem = {
  id: string;
  level: number;
  title: string;
};

export function ArticleToc() {
  const tocRef = useRef<HTMLElement>(null);
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const positionToc = () => {
      const article = document.querySelector(".handsome-main-content");
      if (!article || !tocRef.current) return;

      const articleRight = article.getBoundingClientRect().right;
      const tocRightEdge = articleRight - 12;

      tocRef.current.style.setProperty(
        "--handsome-article-toc-right",
        `${document.documentElement.clientWidth - tocRightEdge}px`,
      );
    };

    const frame = window.requestAnimationFrame(positionToc);
    const observer = new ResizeObserver(positionToc);
    const article = document.querySelector(".handsome-main-content");
    if (article) observer.observe(article);
    window.addEventListener("resize", positionToc);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", positionToc);
    };
  }, [items.length]);

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".post-detail-body .post-content h2[id], .post-detail-body .post-content h3[id], .post-detail-body .post-content h4[id]",
      ),
    );

    const nextItems = headings.map((heading) => ({
      id: heading.id,
      level: Number(heading.tagName.slice(1)),
      title: heading.textContent?.trim() || "未命名章节",
    }));

    setItems(nextItems);

    if (!headings.length) {
      return;
    }

    let frame = 0;
    const updateActiveHeading = () => {
      const readingLine = window.scrollY + 120;
      let currentId = headings[0].id;

      for (const heading of headings) {
        const headingTop = heading.getBoundingClientRect().top + window.scrollY;
        if (headingTop > readingLine) {
          break;
        }
        currentId = heading.id;
      }

      setActiveId(currentId);
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveHeading);
    };

    updateActiveHeading();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, []);

  if (!items.length) {
    return null;
  }

  const jumpToHeading = (id: string) => {
    document.getElementById(id)?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    setActiveId(id);
  };

  return (
    <nav ref={tocRef} className="handsome-article-toc" aria-label="文章目录">
      <ol>
        {items.map((item) => (
          <li key={item.id}>
            <button
              type="button"
              className={item.id === activeId ? "is-active" : undefined}
              data-level={item.level}
              aria-current={item.id === activeId ? "location" : undefined}
              onClick={() => jumpToHeading(item.id)}
            >
              <span className="handsome-article-toc-marker" aria-hidden="true" />
              <span className="handsome-article-toc-label">{item.title}</span>
            </button>
          </li>
        ))}
      </ol>
    </nav>
  );
}

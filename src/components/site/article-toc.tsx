"use client";

import { useEffect, useRef, useState } from "react";

type TocItem = {
  id: string;
  level: number;
  title: string;
};

function getHeadingTitle(heading: HTMLElement) {
  const clone = heading.cloneNode(true) as HTMLElement;
  clone.querySelector(".markdown-heading-icon")?.remove();
  return clone.textContent?.trim() || "未命名章节";
}

export function ArticleToc() {
  const tocRef = useRef<HTMLElement>(null);
  const activeIdRef = useRef("");
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState("");

  useEffect(() => {
    const positionToc = () => {
      if (tocRef.current?.closest(".theme-lite")) return;

      const article = document.querySelector<HTMLElement>(
        ".handsome-main-content",
      );
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
    const article = document.querySelector<HTMLElement>(
      ".handsome-main-content",
    );
    if (article) observer.observe(article);
    window.addEventListener("resize", positionToc);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      window.removeEventListener("resize", positionToc);
    };
  }, [items.length]);

  useEffect(() => {
    let headings: HTMLElement[] = [];
    let headingSignature = "";
    let frame = 0;
    const updateActiveId = (id: string) => {
      if (activeIdRef.current === id) return;
      activeIdRef.current = id;
      setActiveId(id);
    };

    const updateActiveHeading = () => {
      if (!headings.length) {
        updateActiveId("");
        return;
      }

      const readingLine = window.scrollY + 120;
      let currentId = headings[0].id;

      for (const heading of headings) {
        const headingTop = heading.getBoundingClientRect().top + window.scrollY;
        if (headingTop > readingLine) {
          break;
        }
        currentId = heading.id;
      }

      updateActiveId(currentId);
    };

    const collectHeadings = () => {
      headings = Array.from(
        document.querySelectorAll<HTMLElement>(
          ".post-detail-body .post-content h2[id], .post-detail-body .post-content h3[id], .post-detail-body .post-content h4[id]",
        ),
      );

      const nextSignature = headings
        .map((heading) => `${heading.tagName}:${heading.id}:${getHeadingTitle(heading)}`)
        .join("|");

      if (nextSignature !== headingSignature) {
        headingSignature = nextSignature;
        setItems(
          headings.map((heading) => ({
            id: heading.id,
            level: Number(heading.tagName.slice(1)),
            title: getHeadingTitle(heading),
          })),
        );
      }

      updateActiveHeading();
    };

    const handleScroll = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateActiveHeading);
    };

    const contentObserver = new MutationObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(collectHeadings);
    });

    collectHeadings();
    contentObserver.observe(document.body, { childList: true, subtree: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", collectHeadings);

    return () => {
      window.cancelAnimationFrame(frame);
      contentObserver.disconnect();
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", collectHeadings);
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
  };

  return (
    <nav ref={tocRef} className="handsome-article-toc" aria-label="文章目录">
      <h2 className="handsome-article-toc-title">文章目录</h2>
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

type PaperTocNode = TocItem & { children: PaperTocNode[] };

function buildPaperTocTree(items: TocItem[]) {
  const roots: PaperTocNode[] = [];
  const stack: PaperTocNode[] = [];

  for (const item of items) {
    const node: PaperTocNode = { ...item, children: [] };
    while (stack.length && stack[stack.length - 1].level >= node.level) {
      stack.pop();
    }

    if (stack.length) {
      stack[stack.length - 1].children.push(node);
    } else {
      roots.push(node);
    }
    stack.push(node);
  }

  return roots;
}

function PaperTocList({ items }: { items: PaperTocNode[] }) {
  return (
    <ol>
      {items.map((item) => (
        <li key={item.id}>
          <a href={`#${item.id}`}>
            <span className="paper-toc-hash" aria-hidden="true">#</span>
            {item.title}
          </a>
          {item.children.length > 0 && <PaperTocList items={item.children} />}
        </li>
      ))}
    </ol>
  );
}

export function PaperTableOfContents() {
  const [items, setItems] = useState<TocItem[]>([]);
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    const headings = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".post-detail-body .post-content h2[id], .post-detail-body .post-content h3[id], .post-detail-body .post-content h4[id]",
      ),
    );

    setItems(
      headings.map((heading) => ({
        id: heading.id,
        level: Number(heading.tagName.slice(1)),
        title: getHeadingTitle(heading),
      })),
    );
  }, []);

  if (!items.length) {
    return null;
  }

  return (
    <nav className="paper-table-of-contents" aria-label="Table of Contents">
      <button
        className="paper-toc-toggle"
        type="button"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
      >
        <span aria-hidden="true">{isOpen ? "▾" : "▸"}</span>
        Table of Contents
      </button>
      {isOpen && <PaperTocList items={buildPaperTocTree(items)} />}
    </nav>
  );
}

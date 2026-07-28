"use client";

import type { CSSProperties, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { useRouter } from "next/navigation";

export function ClickablePostCard({
  href,
  label,
  className,
  style,
  children,
}: {
  href: string;
  label: string;
  className?: string;
  style?: CSSProperties;
  children: ReactNode;
}) {
  const router = useRouter();

  const openPost = () => {
    router.push(href);
  };

  const handleClick = (event: MouseEvent<HTMLElement>) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    openPost();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    openPost();
  };

  return (
    <article
      className={`post post-card${className ? ` ${className}` : ""}`}
      style={style}
      role="link"
      tabIndex={0}
      aria-label={label}
      onClickCapture={handleClick}
      onKeyDown={handleKeyDown}
    >
      {children}
    </article>
  );
}

"use client";

import { useEffect } from "react";

function checkIcon() {
  return `
    <svg class="pretty-code-copy-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">
      <path d="m5 12 4 4L19 6"></path>
    </svg>
  `;
}

function copyIcon() {
  return `
    <svg class="pretty-code-copy-icon" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round"
      stroke-linejoin="round" aria-hidden="true">
      <rect width="14" height="14" x="8" y="8" rx="2" ry="2"></rect>
      <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"></path>
    </svg>
  `;
}

export function CodeCopyEnhancer() {
  useEffect(() => {
    const buttons = Array.from(
      document.querySelectorAll<HTMLButtonElement>(
        ".post-detail-body [data-code-copy-button]",
      ),
    );
    const cleanups: Array<() => void> = [];

    for (const button of buttons) {
      const figure = button.closest<HTMLElement>(".pretty-code-figure");
      const code = figure?.querySelector("code")?.textContent ?? "";
      let timer = 0;

      const copy = async () => {
        try {
          await navigator.clipboard.writeText(code);
          button.dataset.copied = "true";
          button.setAttribute("aria-label", "已复制");
          button.setAttribute("title", "已复制");
          button.innerHTML = checkIcon();
          window.clearTimeout(timer);
          timer = window.setTimeout(() => {
            delete button.dataset.copied;
            button.setAttribute("aria-label", "复制代码");
            button.setAttribute("title", "复制代码");
            button.innerHTML = copyIcon();
          }, 1500);
        } catch {
          button.setAttribute("aria-label", "复制失败");
          button.setAttribute("title", "复制失败");
        }
      };

      const handleClick = () => void copy();
      button.addEventListener("click", handleClick);
      cleanups.push(() => {
        window.clearTimeout(timer);
        button.removeEventListener("click", handleClick);
      });
    }

    return () => {
      for (const cleanup of cleanups) cleanup();
    };
  }, []);

  return null;
}

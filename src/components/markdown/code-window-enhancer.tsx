"use client";

import { useEffect } from "react";

const languageNames: Record<string, string> = {
  bash: "bash",
  css: "css",
  html: "html",
  javascript: "js",
  js: "js",
  json: "json",
  jsx: "jsx",
  markdown: "md",
  md: "md",
  python: "python",
  py: "python",
  shell: "shell",
  sql: "sql",
  ts: "ts",
  tsx: "tsx",
  typescript: "ts",
  xml: "xml",
  yaml: "yaml",
  yml: "yaml",
};

function languageOf(code: HTMLElement) {
  const languageClass = Array.from(code.classList).find((name) =>
    name.startsWith("language-"),
  );
  const rawLanguage = languageClass?.slice("language-".length).toLowerCase() || "text";
  const name = languageNames[rawLanguage] ?? rawLanguage;
  const badge = name.length <= 3 ? name.toUpperCase() : name.slice(0, 2).toUpperCase();

  return { badge, name };
}

function copyIcon() {
  return `
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <rect width="13" height="13" x="9" y="9" rx="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>
  `;
}

export function CodeWindowEnhancer() {
  useEffect(() => {
    const codeBlocks = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".post-detail-body .markdown-body pre > code:not(.language-mermaid)",
      ),
    );

    for (const code of codeBlocks) {
      const pre = code.parentElement;
      if (!pre || pre.closest(".code-window")) continue;

      const source = code.textContent?.replace(/\n$/, "") ?? "";
      const lines = Math.max(1, source.split("\n").length);
      const language = languageOf(code);

      const windowElement = document.createElement("div");
      windowElement.className = "code-window";

      const header = document.createElement("div");
      header.className = "code-window-header";
      header.innerHTML = `
        <span class="code-window-dots" aria-hidden="true">
          <i></i><i></i><i></i>
        </span>
        <span class="code-window-divider" aria-hidden="true"></span>
        <span class="code-window-language-icon">${language.badge}</span>
        <span class="code-window-language-name">${language.name}</span>
      `;

      const copyButton = document.createElement("button");
      copyButton.className = "code-window-copy";
      copyButton.type = "button";
      copyButton.setAttribute("aria-label", "复制代码");
      copyButton.setAttribute("title", "复制代码");
      copyButton.innerHTML = copyIcon();
      copyButton.addEventListener("click", async () => {
        await navigator.clipboard.writeText(source);
        copyButton.dataset.copied = "true";
        copyButton.setAttribute("aria-label", "已复制");
        window.setTimeout(() => {
          delete copyButton.dataset.copied;
          copyButton.setAttribute("aria-label", "复制代码");
        }, 1400);
      });
      header.append(copyButton);

      const body = document.createElement("div");
      body.className = "code-window-body";

      const lineNumbers = document.createElement("div");
      lineNumbers.className = "code-window-lines";
      lineNumbers.setAttribute("aria-hidden", "true");
      lineNumbers.innerHTML = Array.from(
        { length: lines },
        (_, index) => `<span>${index + 1}</span>`,
      ).join("");

      pre.replaceWith(windowElement);
      body.append(lineNumbers, pre);
      windowElement.append(header, body);
    }
  }, []);

  return null;
}

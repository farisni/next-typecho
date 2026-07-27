"use client";

import { useEffect } from "react";

export function MermaidEnhancer() {
  useEffect(() => {
    let cancelled = false;
    let renderCycle = 0;
    const sourceBlocks = Array.from(
      document.querySelectorAll<HTMLElement>("pre > code.language-mermaid"),
    );

    for (const codeBlock of sourceBlocks) {
      const block = codeBlock.parentElement;
      if (!block || block.dataset.mermaidMounted === "true") continue;

      const container = document.createElement("div");
      container.className = "mermaid-static-mount";
      container.dataset.mermaidSource = codeBlock.textContent ?? "";
      container.textContent = "正在渲染 Mermaid 图表...";
      block.dataset.mermaidMounted = "true";
      block.replaceWith(container);
    }

    async function renderDiagrams() {
      const currentCycle = ++renderCycle;
      const darkMode = document.documentElement.dataset.paperTheme === "dark";
      const containers = Array.from(
        document.querySelectorAll<HTMLElement>(".mermaid-static-mount"),
      );
      const { default: mermaid } = await import("mermaid");
      if (cancelled || currentCycle !== renderCycle) return;

      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: darkMode ? "dark" : "neutral",
      });

      for (const [index, container] of containers.entries()) {
        if (cancelled || currentCycle !== renderCycle) return;

        try {
          const chart = container.dataset.mermaidSource ?? "";
          const id = `mermaid-static-${currentCycle}-${Date.now()}-${index}`;
          const rendered = await mermaid.render(id, chart);
          if (cancelled || currentCycle !== renderCycle) return;

          container.className = "mermaid-static-mount mermaid-diagram";
          container.dataset.mermaidRendered = "true";
          container.dataset.mermaidTheme = darkMode ? "dark" : "light";
          container.innerHTML = rendered.svg;
        } catch (renderError) {
          if (cancelled || currentCycle !== renderCycle) return;

          container.className = "mermaid-static-mount mermaid-error";
          container.dataset.mermaidRendered = "true";
          container.textContent =
            renderError instanceof Error
              ? `Mermaid 图表解析失败：${renderError.message}`
              : "Mermaid 图表解析失败";
        }
      }
    }

    void renderDiagrams();
    const themeObserver = new MutationObserver((mutations) => {
      if (mutations.some((mutation) => mutation.attributeName === "data-paper-theme")) {
        void renderDiagrams();
      }
    });
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-paper-theme"],
    });

    return () => {
      cancelled = true;
      themeObserver.disconnect();
    };
  }, []);

  return null;
}

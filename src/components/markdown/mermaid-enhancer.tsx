"use client";

import { useEffect } from "react";

export function MermaidEnhancer() {
  useEffect(() => {
    let cancelled = false;
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

    const containers = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".mermaid-static-mount:not([data-mermaid-rendered='true'])",
      ),
    );

    async function renderDiagrams() {
      const { default: mermaid } = await import("mermaid");
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: "strict",
        theme: "neutral",
      });

      for (const [index, container] of containers.entries()) {
        if (cancelled) return;

        try {
          const chart = container.dataset.mermaidSource ?? "";
          const id = `mermaid-static-${Date.now()}-${index}`;
          const rendered = await mermaid.render(id, chart);
          if (cancelled) return;

          container.className = "mermaid-static-mount mermaid-diagram";
          container.dataset.mermaidRendered = "true";
          container.innerHTML = rendered.svg;
        } catch (renderError) {
          if (cancelled) return;

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

    return () => {
      cancelled = true;
    };
  }, []);

  return null;
}

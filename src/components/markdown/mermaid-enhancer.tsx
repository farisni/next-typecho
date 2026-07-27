"use client";

import { useEffect } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";

export function MermaidEnhancer() {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".post-detail-body .post-content pre:has(code.language-mermaid)",
      ),
    );
    const mounted: Array<{ container: HTMLDivElement; root: Root }> = [];

    for (const block of blocks) {
      if (block.dataset.mermaidMounted === "true") continue;

      const code = block.querySelector("code.language-mermaid")?.textContent ?? "";
      const container = document.createElement("div");
      container.className = "mermaid-static-mount";
      block.dataset.mermaidMounted = "true";
      block.replaceWith(container);

      const root = createRoot(container);
      root.render(<MermaidDiagram chart={code} />);
      mounted.push({ container, root });
    }

    return () => {
      for (const item of mounted) {
        window.setTimeout(() => {
          item.root.unmount();
          item.container.remove();
        }, 0);
      }
    };
  }, []);

  return null;
}

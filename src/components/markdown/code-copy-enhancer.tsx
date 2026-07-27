"use client";

import { createRoot, type Root } from "react-dom/client";
import { useEffect, useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";

function CodeCopyButton({ code }: { code: string }) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 1500 });
  const [copyFailed, setCopyFailed] = useState(false);

  async function handleCopy() {
    setCopyFailed(false);
    const copied = await copyToClipboard(code);
    setCopyFailed(!copied);
  }

  const label = isCopied ? "已复制" : copyFailed ? "复制失败" : "复制代码";

  return (
    <Button
      type="button"
      size="icon"
      variant="outline"
      className="code-copy-shadcn-button"
      aria-label={label}
      title={label}
      onClick={() => void handleCopy()}
    >
      {isCopied ? <CheckIcon aria-hidden="true" /> : <CopyIcon aria-hidden="true" />}
    </Button>
  );
}

export function CodeCopyEnhancer() {
  useEffect(() => {
    const blocks = Array.from(
      document.querySelectorAll<HTMLElement>(".post-detail-body .post-content pre"),
    );
    const mounted: Array<{ container: HTMLSpanElement; root: Root }> = [];

    for (const block of blocks) {
      if (block.querySelector("code.language-mermaid")) continue;
      if (block.dataset.codeCopyMounted === "true") continue;

      const code = block.querySelector("code")?.textContent ?? block.textContent ?? "";
      const container = document.createElement("span");
      block.dataset.codeCopyMounted = "true";
      block.classList.add("has-code-copy");
      container.className = "code-copy-button-mount";
      container.style.position = "absolute";
      container.style.top = "0.5rem";
      container.style.right = "0.5rem";
      container.style.zIndex = "1";
      block.appendChild(container);

      const root = createRoot(container);
      root.render(<CodeCopyButton code={code} />);
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

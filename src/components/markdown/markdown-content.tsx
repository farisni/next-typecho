import type { ComponentProps } from "react";
import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { markdownCodeText } from "@/components/markdown/code-text";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";
import { remarkHighlight } from "@/components/markdown/remark-highlight";

type MarkdownContentProps = {
  content: string;
};

type MarkdownCodeProps = ComponentProps<"code"> & {
  node?: unknown;
};

function MarkdownCode({ className, children, node, ...props }: MarkdownCodeProps) {
  const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
  if (language === "mermaid") {
    return <MermaidDiagram chart={markdownCodeText(node, children)} />;
  }

  return <code className={className} {...props}>{children}</code>;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  return (
    <div className="markdown-body post-content">
      {/* 不启用 rehype-raw，并额外经过 sanitize，原始 HTML 不会成为可执行 DOM。 */}
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath, remarkHighlight]}
        rehypePlugins={[rehypeSanitize, rehypeKatex]}
        components={{ code: MarkdownCode }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import type { ComponentProps, ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeSanitize from "rehype-sanitize";
import remarkGfm from "remark-gfm";
import remarkMdx from "remark-mdx";
import remarkMath from "remark-math";
import { markdownCodeText } from "@/components/markdown/code-text";
import { MermaidDiagram } from "@/components/markdown/mermaid-diagram";
import { remarkHighlight } from "@/components/markdown/remark-highlight";
import {
  markdownSanitizeSchema,
  remarkMdxCompat,
  usesMdxComponents,
} from "@/lib/markdown/mdx-compat";

type MarkdownContentProps = {
  content: string;
};

type MarkdownCodeProps = ComponentProps<"code"> & {
  node?: unknown;
};

type MarkdownHeadingProps = ComponentProps<"h2"> & {
  node?: unknown;
};

function headingText(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }

  if (Array.isArray(children)) {
    return children.map(headingText).join("");
  }

  if (children && typeof children === "object" && "props" in children) {
    return headingText((children as { props?: { children?: ReactNode } }).props?.children);
  }

  return "";
}

function headingSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^\p{Letter}\p{Number}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "") || "section";
}

function MarkdownCode({ className, children, node, ...props }: MarkdownCodeProps) {
  const language = /language-([\w-]+)/.exec(className ?? "")?.[1];
  if (language === "mermaid") {
    return <MermaidDiagram chart={markdownCodeText(node, children)} />;
  }

  return <code className={className} {...props}>{children}</code>;
}

export function MarkdownContent({ content }: MarkdownContentProps) {
  const usesMdx = usesMdxComponents(content);
  const headingCounts = new Map<string, number>();
  const createHeading = (Tag: "h1" | "h2" | "h3" | "h4" | "h5" | "h6") => {
    function MarkdownHeading({ children, node, ...props }: MarkdownHeadingProps) {
      const baseId = headingSlug(headingText(children));
      const occurrence = headingCounts.get(baseId) ?? 0;
      const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
      headingCounts.set(baseId, occurrence + 1);

      return (
        <Tag id={id} {...props}>
          <span className="markdown-heading-icon" aria-hidden="true" />
          <span className="markdown-heading-text">{children}</span>
        </Tag>
      );
    }

    return MarkdownHeading;
  };

  return (
    <div className="markdown-body post-content">
      {/* 不启用 rehype-raw，并额外经过 sanitize，原始 HTML 不会成为可执行 DOM。 */}
      <ReactMarkdown
        remarkPlugins={[
          remarkGfm,
          remarkMath,
          ...(usesMdx ? [remarkMdx, remarkMdxCompat] : []),
          remarkHighlight,
        ]}
        rehypePlugins={[
          [rehypeSanitize, markdownSanitizeSchema],
          [rehypeHighlight, { detect: false, plainText: ["mermaid"] }],
          rehypeKatex,
        ]}
        components={{
          code: MarkdownCode,
          h1: createHeading("h1"),
          h2: createHeading("h2"),
          h3: createHeading("h3"),
          h4: createHeading("h4"),
          h5: createHeading("h5"),
          h6: createHeading("h6"),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

import type { Heading, Node, Parent, Root, PhrasingContent, Text } from "mdast";
import type { Plugin } from "unified";
import type { Root as HastRoot, Element } from "hast";
import { unified } from "unified";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeKatex from "rehype-katex";
import rehypePrettyCode from "rehype-pretty-code";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkMdx from "remark-mdx";
import { remarkHighlight } from "@/components/markdown/remark-highlight";
import {
  markdownSanitizeSchema,
  remarkMdxCompat,
  usesMdxComponents,
} from "@/lib/markdown/mdx-compat";
import {
  prettyCodeOptions,
  rehypeProtectMermaid,
  rehypePrettyCodeWindow,
} from "@/lib/markdown/rehype-pretty-code-window";

function toPlainText(node: unknown): string {
  if (node == null) return "";

  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }

  if (Array.isArray(node)) {
    return node.map(toPlainText).join("");
  }

  if (typeof node === "object" && node !== null && "type" in node) {
    const typed = node as { type?: string; value?: unknown; children?: unknown[] };

    if (typed.type === "text") return String((typed as Text).value ?? "");

    return toPlainText(typed.children as unknown[]);
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

const addHeadingIds: Plugin<[], Root, Root> = () => {
  return (tree: Root) => {
    const headingCounts = new Map<string, number>();

    const walk = (node: Node) => {
      if ((node as Heading).type === "heading") {
        const heading = node as Heading & { data?: { hProperties?: Record<string, unknown> } };
        const baseId = headingSlug(toPlainText(heading.children as unknown as PhrasingContent[]));
        const occurrence = headingCounts.get(baseId) ?? 0;
        headingCounts.set(baseId, occurrence + 1);

        const id = occurrence ? `${baseId}-${occurrence + 1}` : baseId;
        heading.data = {
          ...(heading.data ?? {}),
          hProperties: {
            ...(heading.data?.hProperties ?? {}),
            id,
          },
        };
      }

      if (Array.isArray((node as Parent).children)) {
        for (const child of (node as Parent).children) {
          walk(child as Node);
        }
      }
    };

    walk(tree);
  };
};

const decorateHeadings: Plugin<[], HastRoot, HastRoot> = () => {
  return (tree: HastRoot) => {
    const walk = (nodes?: Array<Element | any>) => {
      if (!nodes) return;

      for (const node of nodes) {
        if (node.type === "element" && /^h[1-6]$/.test(node.tagName ?? "")) {
          const rawChildren = Array.isArray(node.children) ? node.children : [];
          node.children = [
            {
              type: "element",
              tagName: "span",
              properties: { className: ["markdown-heading-icon"] },
              children: [],
            },
            {
              type: "element",
              tagName: "span",
              properties: { className: ["markdown-heading-text"] },
              children: rawChildren,
            },
          ];
        }

        walk(node.children);
      }
    };

    walk(tree.children as Array<Element | any>);
  };
};

export async function renderMarkdownToHtml(content: string) {
  if (!content) return "";

  const usesMdx = usesMdxComponents(content);

  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkMath);
    if (usesMdx) processor.use(remarkMdx).use(remarkMdxCompat);

    return (
      await processor
      .use(remarkHighlight)
      .use(addHeadingIds)
      .use(remarkRehype)
      .use(decorateHeadings)
      .use(rehypeSanitize, markdownSanitizeSchema)
      .use(rehypeProtectMermaid)
      .use(rehypePrettyCode, prettyCodeOptions)
      .use(rehypePrettyCodeWindow)
      .use(rehypeKatex)
      .use(rehypeStringify)
      .process(content)
    ).toString();
  } catch (error) {
    if (usesMdx) {
      const message = error instanceof Error ? error.message : "未知错误";
      throw new Error(`文章中的 MDX 无法发布：${message}`, { cause: error });
    }
    return "";
  }
}

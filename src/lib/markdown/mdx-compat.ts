import type { Node, Parent, Root } from "mdast";
import { defaultSchema } from "rehype-sanitize";
import type { Plugin } from "unified";

type MdxAttribute = {
  type?: string;
  name?: unknown;
  value?: unknown;
};

type MdxElement = Node & {
  type: "mdxJsxFlowElement" | "mdxJsxTextElement";
  name?: string | null;
  attributes?: MdxAttribute[];
  children?: Node[];
};

const MDX_COMPONENT_PATTERN = /<(?:Callout|Badge)(?=[\s/>])/;
const BLOCKED_MDX_NODES = new Set([
  "mdxjsEsm",
  "mdxFlowExpression",
  "mdxTextExpression",
]);

const CALLOUT_TYPES = new Set(["info", "note", "success", "warning", "danger"]);
const BADGE_TONES = new Set(["neutral", "blue", "green", "orange", "red"]);

export const markdownSanitizeSchema = {
  ...defaultSchema,
  tagNames: [...(defaultSchema.tagNames ?? []), "aside"],
  attributes: {
    ...defaultSchema.attributes,
    aside: [
      ...(defaultSchema.attributes?.aside ?? []),
      [
        "className",
        "mdx-callout",
        "mdx-callout-info",
        "mdx-callout-note",
        "mdx-callout-success",
        "mdx-callout-warning",
        "mdx-callout-danger",
      ],
      ["role", "note"],
    ],
    p: [
      ...(defaultSchema.attributes?.p ?? []),
      ["className", "mdx-callout-title"],
    ],
    span: [
      ...(defaultSchema.attributes?.span ?? []),
      [
        "className",
        "markdown-heading-icon",
        "markdown-heading-text",
        "mdx-badge",
        "mdx-badge-neutral",
        "mdx-badge-blue",
        "mdx-badge-green",
        "mdx-badge-orange",
        "mdx-badge-red",
      ],
    ],
  },
};

export function usesMdxComponents(content: string) {
  return MDX_COMPONENT_PATTERN.test(content);
}

function componentError(message: string): never {
  throw new Error(`MDX 组件解析失败：${message}`);
}

function readAttributes(node: MdxElement, allowedNames: string[]) {
  const result = new Map<string, string>();
  const allowed = new Set(allowedNames);

  for (const attribute of node.attributes ?? []) {
    if (attribute.type !== "mdxJsxAttribute" || typeof attribute.name !== "string") {
      componentError("不支持展开属性或表达式属性");
    }
    if (!allowed.has(attribute.name)) {
      componentError(`<${node.name}> 不支持属性 ${attribute.name}`);
    }
    if (attribute.value !== null && attribute.value !== undefined && typeof attribute.value !== "string") {
      componentError(`${attribute.name} 只能使用普通字符串`);
    }

    result.set(attribute.name, typeof attribute.value === "string" ? attribute.value : "");
  }

  return result;
}

function transformCallout(node: MdxElement): Node {
  if (node.type !== "mdxJsxFlowElement") {
    componentError("<Callout> 必须单独占一行");
  }

  const attributes = readAttributes(node, ["type", "title"]);
  const type = attributes.get("type") || "info";
  if (!CALLOUT_TYPES.has(type)) {
    componentError(`Callout type 不支持 ${type}`);
  }

  const children = [...(node.children ?? [])];
  const title = attributes.get("title")?.trim();
  if (title) {
    children.unshift({
      type: "paragraph",
      children: [{
        type: "strong",
        children: [{ type: "text", value: title }],
      }],
      data: {
        hProperties: { className: ["mdx-callout-title"] },
      },
    } as Node);
  }

  return {
    type: "blockquote",
    children,
    data: {
      hName: "aside",
      hProperties: {
        className: ["mdx-callout", `mdx-callout-${type}`],
        role: "note",
      },
    },
  } as Node;
}

function transformBadge(node: MdxElement): Node {
  const attributes = readAttributes(node, ["tone"]);
  const tone = attributes.get("tone") || "neutral";
  if (!BADGE_TONES.has(tone)) {
    componentError(`Badge tone 不支持 ${tone}`);
  }

  const badge = {
    type: "emphasis",
    children: [...(node.children ?? [])],
    data: {
      hName: "span",
      hProperties: {
        className: ["mdx-badge", `mdx-badge-${tone}`],
      },
    },
  } as Node;

  if (node.type === "mdxJsxFlowElement") {
    return {
      type: "paragraph",
      children: [badge],
    } as Node;
  }

  return badge;
}

function transformParent(parent: Parent) {
  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index] as Node & {
      type: string;
      children?: Node[];
    };

    if (BLOCKED_MDX_NODES.has(child.type)) {
      componentError("不允许 import、export 或 JavaScript 表达式");
    }

    if (child.type === "mdxJsxFlowElement" || child.type === "mdxJsxTextElement") {
      const element = child as MdxElement;
      if (Array.isArray(element.children)) transformParent(element as unknown as Parent);

      if (element.name === "Callout") {
        parent.children[index] = transformCallout(element) as typeof parent.children[number];
      } else if (element.name === "Badge") {
        parent.children[index] = transformBadge(element) as typeof parent.children[number];
      } else {
        componentError(`未注册组件 <${element.name || "Fragment"}>`);
      }
      continue;
    }

    if (Array.isArray(child.children)) {
      transformParent(child as unknown as Parent);
    }
  }
}

export const remarkMdxCompat: Plugin<[], Root> = () => (tree) => {
  transformParent(tree);
};

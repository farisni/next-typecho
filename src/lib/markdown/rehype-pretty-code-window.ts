import type { Element, ElementContent, Properties, Root, RootContent, Text } from "hast";
import type { Options } from "rehype-pretty-code";
import type { Plugin } from "unified";

type LanguageMeta = {
  badge: string;
  label: string;
  short: string;
};

const MERMAID_MARKER = "__NEXT_TYPECHO_MERMAID__\n";

const languageMeta: Record<string, LanguageMeta> = {
  astro: { badge: "A", label: "Astro", short: "astro" },
  bash: { badge: "$", label: "Shell", short: "bash" },
  css: { badge: "CSS", label: "CSS", short: "css" },
  html: { badge: "<>", label: "HTML", short: "html" },
  javascript: { badge: "JS", label: "JavaScript", short: "js" },
  js: { badge: "JS", label: "JavaScript", short: "js" },
  json: { badge: "{}", label: "JSON", short: "json" },
  jsx: { badge: "JSX", label: "React JSX", short: "jsx" },
  markdown: { badge: "MD", label: "Markdown", short: "md" },
  md: { badge: "MD", label: "Markdown", short: "md" },
  plaintext: { badge: "TXT", label: "Plain Text", short: "text" },
  python: { badge: "PY", label: "Python", short: "python" },
  py: { badge: "PY", label: "Python", short: "python" },
  shell: { badge: "$", label: "Shell", short: "shell" },
  sql: { badge: "SQL", label: "SQL", short: "sql" },
  text: { badge: "TXT", label: "Plain Text", short: "text" },
  ts: { badge: "TS", label: "TypeScript", short: "ts" },
  tsx: { badge: "TSX", label: "React TSX", short: "tsx" },
  typescript: { badge: "TS", label: "TypeScript", short: "ts" },
  xml: { badge: "<>", label: "XML", short: "xml" },
  yaml: { badge: "YML", label: "YAML", short: "yaml" },
  yml: { badge: "YML", label: "YAML", short: "yaml" },
};

export const prettyCodeOptions: Options = {
  theme: {
    dark: "one-dark-pro",
    light: "github-light",
  },
  keepBackground: false,
  defaultLang: {
    block: "text",
    inline: "text",
  },
  grid: true,
};

function text(value: string): Text {
  return { type: "text", value };
}

function element(
  tagName: string,
  className: string[],
  children: ElementContent[],
  properties: Properties = {},
): Element {
  return {
    type: "element",
    tagName,
    properties: {
      ...properties,
      ...(className.length ? { className } : {}),
    },
    children,
  };
}

function nodeText(node: RootContent | ElementContent): string {
  if (node.type === "text") return node.value;
  if ("children" in node) return node.children.map((child) => nodeText(child)).join("");
  return "";
}

function findElement(node: Element, tagName: string): Element | undefined {
  if (node.tagName === tagName) return node;

  for (const child of node.children) {
    if (child.type !== "element") continue;
    const found = findElement(child, tagName);
    if (found) return found;
  }

  return undefined;
}

function dataValue(properties: Properties, name: string) {
  const camelName = name.replace(/-([a-z])/g, (_, letter: string) => letter.toUpperCase());
  return properties[name] ?? properties[camelName];
}

function languageFor(pre: Element, code: Element) {
  const rawLanguage = String(
    dataValue(pre.properties, "data-language") ??
      dataValue(code.properties, "data-language") ??
      "text",
  ).toLowerCase();

  return rawLanguage;
}

function copyIcon(): Element {
  return element(
    "svg",
    ["pretty-code-copy-icon"],
    [
      element("rect", [], [], { width: 14, height: 14, x: 8, y: 8, rx: 2, ry: 2 }),
      element("path", [], [], {
        d: "M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2",
      }),
    ],
    {
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      ariaHidden: "true",
    },
  );
}

function codeHeader(language: string): Element {
  const meta = languageMeta[language] ?? {
    badge: language.slice(0, 3).toUpperCase(),
    label: language,
    short: language,
  };

  return element("div", ["pretty-code-header"], [
    element(
      "span",
      ["pretty-code-dots"],
      [
        element("i", ["pretty-code-dot", "pretty-code-dot-red"], []),
        element("i", ["pretty-code-dot", "pretty-code-dot-yellow"], []),
        element("i", ["pretty-code-dot", "pretty-code-dot-green"], []),
      ],
      { ariaHidden: "true" },
    ),
    element("span", ["pretty-code-divider"], [], { ariaHidden: "true" }),
    element("span", ["pretty-code-language-icon"], [text(meta.badge)], {
      ariaHidden: "true",
    }),
    element("span", ["pretty-code-language-label"], [text(meta.label)]),
    element("span", ["pretty-code-language-short"], [text(meta.short)]),
    element(
      "button",
      ["pretty-code-copy"],
      [copyIcon()],
      {
        type: "button",
        ariaLabel: "复制代码",
        title: "复制代码",
        dataCodeCopyButton: "",
      },
    ),
  ]);
}

function restoreMermaid(source: string): Element {
  return element(
    "pre",
    [],
    [
      element(
        "code",
        ["language-mermaid"],
        [text(source)],
      ),
    ],
  );
}

function decoratePrettyCodeFigure(figure: Element): Element {
  const pre = findElement(figure, "pre");
  const code = pre ? findElement(pre, "code") : undefined;
  if (!pre || !code) return figure;

  const source = nodeText(code);
  if (source.startsWith(MERMAID_MARKER)) {
    return restoreMermaid(source.slice(MERMAID_MARKER.length));
  }

  const language = languageFor(pre, code);
  code.properties.dataLineNumbers = "";
  const existingClasses = Array.isArray(figure.properties.className)
    ? figure.properties.className.map(String)
    : [];
  figure.properties.className = [...existingClasses, "pretty-code-figure"];
  figure.children = [
    element("div", ["pretty-code-window"], [
      codeHeader(language),
      element("div", ["pretty-code-body"], [pre]),
    ]),
  ];

  return figure;
}

function isPrettyCodeFigure(node: Element) {
  return (
    node.tagName === "figure" &&
    dataValue(node.properties, "data-rehype-pretty-code-figure") !== undefined
  );
}

export const rehypePrettyCodeWindow: Plugin<[], Root, Root> = () => {
  return (tree) => {
    const walk = (parent: Root | Element) => {
      for (let index = 0; index < parent.children.length; index += 1) {
        const child = parent.children[index];
        if (child.type !== "element") continue;

        if (isPrettyCodeFigure(child)) {
          (parent.children as RootContent[])[index] = decoratePrettyCodeFigure(child);
          continue;
        }

        walk(child);
      }
    };

    walk(tree);
  };
};

export const rehypeProtectMermaid: Plugin<[], Root, Root> = () => {
  return (tree) => {
    const walk = (node: Root | Element) => {
      for (const child of node.children) {
        if (child.type !== "element") continue;

        if (child.tagName === "pre") {
          const code = findElement(child, "code");
          const classNames = Array.isArray(code?.properties.className)
            ? code.properties.className.map(String)
            : [];

          if (code && classNames.includes("language-mermaid")) {
            code.properties.className = [
              ...classNames.filter((className) => className !== "language-mermaid"),
              "language-text",
            ];
            code.children = [text(`${MERMAID_MARKER}${nodeText(code)}`)];
          }
        }

        walk(child);
      }
    };

    walk(tree);
  };
};

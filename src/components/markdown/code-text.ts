import { isValidElement } from "react";
import type { ReactNode } from "react";

type SyntaxNode = {
  type?: string;
  value?: string;
  children?: SyntaxNode[];
};

function syntaxNodeText(node: unknown): string {
  if (!node || typeof node !== "object") return "";

  const syntaxNode = node as SyntaxNode;
  if (syntaxNode.type === "text") return syntaxNode.value ?? "";
  return syntaxNode.children?.map(syntaxNodeText).join("") ?? "";
}

function reactNodeText(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(reactNodeText).join("");
  if (isValidElement<{ children?: ReactNode }>(node)) return reactNodeText(node.props.children);
  return "";
}

export function markdownCodeText(node: unknown, children: ReactNode): string {
  return (syntaxNodeText(node) || reactNodeText(children)).replace(/\n$/, "");
}

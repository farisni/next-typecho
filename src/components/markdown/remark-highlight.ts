import type { Parent, PhrasingContent, Root, Text } from "mdast";
import type { Plugin } from "unified";

type HighlightNode = {
  type: "highlight";
  children: Text[];
  data: {
    hName: "mark";
  };
};

function highlightText(value: string): Array<PhrasingContent | HighlightNode> {
  const result: Array<PhrasingContent | HighlightNode> = [];
  const pattern = /==([^=\n]+)==/g;
  let cursor = 0;

  for (const match of value.matchAll(pattern)) {
    const index = match.index ?? 0;
    if (index > cursor) result.push({ type: "text", value: value.slice(cursor, index) });
    result.push({
      type: "highlight",
      children: [{ type: "text", value: match[1] }],
      data: { hName: "mark" },
    });
    cursor = index + match[0].length;
  }

  if (cursor === 0) return [{ type: "text", value }];
  if (cursor < value.length) result.push({ type: "text", value: value.slice(cursor) });
  return result;
}

function transformParent(parent: Parent) {
  for (let index = 0; index < parent.children.length; index += 1) {
    const child = parent.children[index];
    if (child.type === "text" && child.value.includes("==")) {
      const replacement = highlightText(child.value);
      parent.children.splice(index, 1, ...(replacement as PhrasingContent[]));
      index += replacement.length - 1;
      continue;
    }

    if ("children" in child) transformParent(child as Parent);
  }
}

export const remarkHighlight: Plugin<[], Root> = () => (tree) => {
  transformParent(tree);
};

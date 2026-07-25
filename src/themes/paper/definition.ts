import { z } from "zod";
import {
  builtInThemeSourceNotice,
  type ThemeDefinition,
} from "@/themes/types";

export type PaperThemeConfig = {
  accentColor: "red" | "blue";
};

export const paperThemeConfigSchema = z.object({
  accentColor: z.enum(["red", "blue"]).default("red"),
});

export const paperThemeDefinition = {
  slug: "paper",
  title: "Paper",
  author: "Next Typecho",
  homepage: "https://farisni.top",
  version: "1.0.0",
  description: "参考 Astro Cactus 的窄栏等宽博客主题",
  screenshotPath: "/themes/paper/screenshot.svg",
  defaults: {
    accentColor: "red",
  },
  configSchema: paperThemeConfigSchema,
  settings: [
    {
      kind: "select",
      name: "accentColor",
      label: "强调色",
      description: "选择导航、标题和链接使用的强调色。",
      options: [
        { value: "red", label: "仙人掌红" },
        { value: "blue", label: "纸墨蓝" },
      ],
    },
  ],
  sourceFiles: [
    {
      name: "layout.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function PaperThemeLayout({ children }) {\n  return <div className="theme-paper">{children}</div>;\n}\n`,
    },
    {
      name: "style.css",
      language: "css",
      editable: false,
      content: `/* Paper 主题样式由 .theme-paper 根节点隔离。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-paper {\n  --paper-accent: #df2947;\n}\n`,
    },
  ],
} satisfies ThemeDefinition<PaperThemeConfig>;

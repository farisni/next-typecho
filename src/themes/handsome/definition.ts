import { z } from "zod";
import {
  builtInThemeSourceNotice,
  type ThemeDefinition,
} from "@/themes/types";

export const handsomeRightSidebarBlocks = [
  "Profile",
  "RecentPosts",
  "Categories",
  "Archives",
] as const;

export type HandsomeRightSidebarBlock = (typeof handsomeRightSidebarBlocks)[number];

export type HandsomeThemeConfig = {
  colorScheme: "default" | "mint";
  logoUrl: string;
  rightSidebarBlocks: HandsomeRightSidebarBlock[];
};

const logoUrlSchema = z
  .string()
  .trim()
  .max(500, "LOGO 地址长度超过限制")
  .refine((value) => {
    if (!value) return true;
    try {
      return ["http:", "https:"].includes(new URL(value).protocol);
    } catch {
      return false;
    }
  }, "请填写一个合法的 HTTP 或 HTTPS 图片地址");

export const handsomeThemeConfigSchema = z.object({
  colorScheme: z.enum(["default", "mint"]).default("default"),
  logoUrl: logoUrlSchema,
  rightSidebarBlocks: z.array(z.enum(handsomeRightSidebarBlocks)),
});

export const handsomeThemeDefinition = {
  slug: "handsome",
  title: "Handsome",
  author: "Next Typecho",
  homepage: "https://farisni.com",
  version: "1.0.0",
  description: "固定侧栏与三栏内容布局的现代博客主题",
  screenshotPath: "/themes/handsome/screenshot.svg",
  defaults: {
    colorScheme: "default",
    logoUrl: "",
    rightSidebarBlocks: [...handsomeRightSidebarBlocks],
  },
  configSchema: handsomeThemeConfigSchema,
  settings: [
    {
      kind: "select",
      name: "colorScheme",
      label: "主题色系",
      description: "选择 Handsome 的整体界面配色。",
      options: [
        { value: "default", label: "默认深顶栏" },
        { value: "mint", label: "薄荷青灰" },
      ],
    },
    {
      kind: "url",
      name: "logoUrl",
      label: "博客头像地址",
      description: "填写图片 URL 后，将替换左侧导航中的文字头像。",
      placeholder: "https://example.com/avatar.png",
    },
    {
      kind: "checkbox-group",
      name: "rightSidebarBlocks",
      label: "右侧信息栏",
      options: [
        { value: "Profile", label: "显示博客简介" },
        { value: "RecentPosts", label: "显示最新文章" },
        { value: "Categories", label: "显示文章分类" },
        { value: "Archives", label: "显示文章归档" },
      ],
    },
  ],
  sourceFiles: [
    {
      name: "layout.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function HandsomeThemeLayout({ children }) {\n  return <div className="theme-handsome">{children}</div>;\n}\n`,
    },
    {
      name: "sidebar.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function Sidebar() {\n  return <aside className="handsome-sidebar">{/* 固定导航 */}</aside>;\n}\n`,
    },
    {
      name: "header.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function Header() {\n  return <header className="handsome-header">{/* 顶部工具栏 */}</header>;\n}\n`,
    },
    {
      name: "style.css",
      language: "css",
      editable: false,
      content: `/* Handsome 主题样式由 .theme-handsome 根节点隔离。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-handsome {\n  --handsome-accent: #295f9f;\n}\n`,
    },
  ],
} satisfies ThemeDefinition<HandsomeThemeConfig>;

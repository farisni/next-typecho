import { z } from "zod";
import {
  builtInThemeSourceNotice,
  type ThemeDefinition,
} from "@/themes/types";

export const defaultSidebarBlocks = [
  "ShowRecentPosts",
  "ShowRecentComments",
  "ShowCategory",
  "ShowArchive",
  "ShowOther",
] as const;

export type DefaultSidebarBlock = (typeof defaultSidebarBlocks)[number];

export type DefaultThemeConfig = {
  logoUrl: string;
  sidebarBlocks: DefaultSidebarBlock[];
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

export const defaultThemeConfigSchema = z.object({
  logoUrl: logoUrlSchema,
  sidebarBlocks: z.array(z.enum(defaultSidebarBlocks)),
});

export const defaultThemeDefinition = {
  slug: "default",
  title: "Typecho Replica Theme",
  author: "Typecho Team",
  homepage: "https://typecho.org",
  version: "1.2",
  description: "当前站点使用的默认主题",
  screenshotPath: "/themes/default/screenshot.svg",
  defaults: {
    logoUrl: "",
    sidebarBlocks: [...defaultSidebarBlocks],
  },
  configSchema: defaultThemeConfigSchema,
  settings: [
    {
      kind: "url",
      name: "logoUrl",
      label: "站点 LOGO 地址",
      description: "在这里填入一个图片 URL 地址, 以在网站标题前加上一个 LOGO",
      placeholder: "https://example.com/logo.png",
    },
    {
      kind: "checkbox-group",
      name: "sidebarBlocks",
      label: "侧边栏显示",
      options: [
        { value: "ShowRecentPosts", label: "显示最新文章" },
        { value: "ShowRecentComments", label: "显示最近回复" },
        { value: "ShowCategory", label: "显示分类" },
        { value: "ShowArchive", label: "显示归档" },
        { value: "ShowOther", label: "显示其它杂项" },
      ],
    },
  ],
  sourceFiles: [
    {
      name: "layout.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function DefaultThemeLayout({ children }) {\n  return <div className="theme-site theme-default">{children}</div>;\n}\n`,
    },
    {
      name: "sidebar.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\n// 侧栏模块由“设置外观”中的 sidebarBlocks 控制，登录状态在服务端读取。\nexport function DefaultSidebar() {\n  return <aside id="secondary">{/* 最新文章、回复、分类、归档和其它 */}</aside>;\n}\n`,
    },
    {
      name: "style.css",
      language: "css",
      editable: false,
      content: `/* Typecho Default Theme 1.2 的样式由 .theme-default 作用域隔离。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-default {\n  background: #fff;\n  color: #444;\n}\n`,
    },
  ],
} satisfies ThemeDefinition<DefaultThemeConfig>;

import { z } from "zod";
import {
  builtInThemeSourceNotice,
  type ThemeDefinition,
} from "@/themes/types";

export type ClassicThemeConfig = {
  logoUrl: string;
  colorSchema: "auto" | "light" | "dark" | "customize";
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

export const classicThemeConfigSchema = z.object({
  logoUrl: logoUrlSchema,
  colorSchema: z.enum(["auto", "light", "dark", "customize"]),
});

export const classic22ThemeDefinition = {
  slug: "classic-22",
  title: "Classic 22",
  author: "Typecho Team",
  homepage: "https://typecho.org",
  version: "1.0",
  description: "Just another official theme",
  screenshotPath: "/themes/classic-22/screenshot.svg",
  defaults: {
    logoUrl: "",
    colorSchema: "auto",
  },
  configSchema: classicThemeConfigSchema,
  settings: [
    {
      kind: "url",
      name: "logoUrl",
      label: "网站 Logo",
      description: "在这里填写图片 URL，网站将显示 Logo",
      placeholder: "https://example.com/logo.png",
    },
    {
      kind: "select",
      name: "colorSchema",
      label: "外观风格",
      description: "选择自定义时将使用 Classic 22 的官方示例配色，可继续通过 custom.css 覆盖。",
      options: [
        { value: "auto", label: "自动" },
        { value: "light", label: "浅色" },
        { value: "dark", label: "深色" },
        { value: "customize", label: "自定义" },
      ],
    },
  ],
  sourceFiles: [
    {
      name: "layout.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\nexport function Classic22ThemeLayout({ children }) {\n  return <div className="theme-classic-22"><main>{children}</main></div>;\n}\n`,
    },
    {
      name: "header.tsx",
      language: "tsx",
      editable: false,
      content: `${builtInThemeSourceNotice}\n\n// Classic 22 使用品牌栏、响应式导航与内联搜索框。\nexport function Classic22Header() {\n  return <header className="classic-navbar">{/* brand and navigation */}</header>;\n}\n`,
    },
    {
      name: "style.css",
      language: "css",
      editable: false,
      content: `/* Classic 22 的 light、dark、auto、customize 配色均由主题作用域变量驱动。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-classic-22 {\n  --classic-primary: #1095c1;\n}\n`,
    },
  ],
} satisfies ThemeDefinition<ClassicThemeConfig>;

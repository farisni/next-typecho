export const themeSlugs = ["default", "classic-22"] as const;
export type ThemeSlug = (typeof themeSlugs)[number];

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

export type ClassicThemeConfig = {
  logoUrl: string;
  colorSchema: "auto" | "light" | "dark" | "customize";
};

export type ThemeConfig = DefaultThemeConfig | ClassicThemeConfig;

export type ThemeSourceFile = {
  name: string;
  language: string;
  content: string;
  editable: false;
};

export type ThemeDefinition = {
  slug: ThemeSlug;
  title: string;
  author: string;
  homepage: string;
  version: string;
  description: string;
  screenshotPath: string;
  defaults: ThemeConfig;
  sourceFiles: ThemeSourceFile[];
};

const sharedSourceNotice = `/**
 * Next Typecho 内置主题
 *
 * 内置 React/TypeScript 模板随应用构建并以只读方式展示。
 * 在线修改可执行源码会破坏 RSC 和构建产物一致性，因此请使用 custom.css
 * 完成无需重新构建的外观覆盖；本地开发时可直接修改 src 下的主题组件。
 */`;

export const themeRegistry: Record<ThemeSlug, ThemeDefinition> = {
  default: {
    slug: "default",
    title: "Typecho Replica Theme",
    author: "Typecho Team",
    homepage: "https://typecho.org",
    version: "1.2",
    description: "Default theme for Typecho",
    screenshotPath: "/themes/default/screenshot.svg",
    defaults: {
      logoUrl: "",
      sidebarBlocks: [...defaultSidebarBlocks],
    } satisfies DefaultThemeConfig,
    sourceFiles: [
      {
        name: "index.tsx",
        language: "tsx",
        editable: false,
        content: `${sharedSourceNotice}\n\nexport function DefaultThemeLayout({ children }) {\n  return <div className=\"theme-site theme-default\">{children}</div>;\n}\n`,
      },
      {
        name: "sidebar.tsx",
        language: "tsx",
        editable: false,
        content: `${sharedSourceNotice}\n\n// 侧栏模块由“设置外观”中的 sidebarBlocks 控制，登录状态在服务端读取。\nexport function DefaultSidebar() {\n  return <aside id=\"secondary\">{/* 最新文章、回复、分类、归档和其它 */}</aside>;\n}\n`,
      },
      {
        name: "style.css",
        language: "css",
        editable: false,
        content: `/* Typecho Default Theme 1.2 的基础样式已经编译到应用全局样式中。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-default {\n  background: #fff;\n  color: #444;\n}\n`,
      },
    ],
  },
  "classic-22": {
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
    } satisfies ClassicThemeConfig,
    sourceFiles: [
      {
        name: "index.tsx",
        language: "tsx",
        editable: false,
        content: `${sharedSourceNotice}\n\nexport function Classic22ThemeLayout({ children }) {\n  return <div className=\"theme-classic-22\"><main>{children}</main></div>;\n}\n`,
      },
      {
        name: "header.tsx",
        language: "tsx",
        editable: false,
        content: `${sharedSourceNotice}\n\n// Classic 22 使用品牌栏、响应式导航与内联搜索框。\nexport function Classic22Header() {\n  return <header className=\"classic-navbar\">{/* brand and navigation */}</header>;\n}\n`,
      },
      {
        name: "style.css",
        language: "css",
        editable: false,
        content: `/* Classic 22 的 light、dark、auto、customize 配色均由主题作用域变量驱动。\n * 请通过 custom.css 添加覆盖规则。\n */\n.theme-classic-22 {\n  --classic-primary: #1095c1;\n}\n`,
      },
    ],
  },
};

export function isThemeSlug(value: unknown): value is ThemeSlug {
  return typeof value === "string" && themeSlugs.includes(value as ThemeSlug);
}

export function getThemeDefinition(slug: ThemeSlug) {
  return themeRegistry[slug];
}

export function getDefaultThemeConfig(slug: ThemeSlug): ThemeConfig {
  const defaults = themeRegistry[slug].defaults;
  return slug === "default"
    ? { ...(defaults as DefaultThemeConfig), sidebarBlocks: [...(defaults as DefaultThemeConfig).sidebarBlocks] }
    : { ...(defaults as ClassicThemeConfig) };
}

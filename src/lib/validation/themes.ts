import { z } from "zod";
import {
  defaultSidebarBlocks,
  themeSlugs,
  type ClassicThemeConfig,
  type DefaultThemeConfig,
  type ThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";

export const themeSlugSchema = z.enum(themeSlugs);

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

export const classicThemeConfigSchema = z.object({
  logoUrl: logoUrlSchema,
  colorSchema: z.enum(["auto", "light", "dark", "customize"]),
});

export const themeCustomCssSchema = z
  .string()
  .max(100_000, "自定义 CSS 不能超过 100,000 个字符")
  .refine((value) => !/<\/style/i.test(value), "自定义 CSS 不能包含 </style 标签");

export function parseThemeConfig(slug: "default", value: unknown): DefaultThemeConfig;
export function parseThemeConfig(slug: "classic-22", value: unknown): ClassicThemeConfig;
export function parseThemeConfig(slug: ThemeSlug, value: unknown): ThemeConfig;
export function parseThemeConfig(slug: ThemeSlug, value: unknown): ThemeConfig {
  return slug === "default"
    ? defaultThemeConfigSchema.parse(value)
    : classicThemeConfigSchema.parse(value);
}

import { z } from "zod";
import {
  getThemeDefinition,
  isThemeSlug,
  type ThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";

export {
  classicThemeConfigSchema,
  defaultThemeConfigSchema,
} from "@/lib/themes/registry";

export const themeSlugSchema = z.custom<ThemeSlug>(
  isThemeSlug,
  "外观名称无效",
);

export const themeCustomCssSchema = z
  .string()
  .max(100_000, "自定义 CSS 不能超过 100,000 个字符")
  .refine((value) => !/<\/style/i.test(value), "自定义 CSS 不能包含 </style 标签");

export function parseThemeConfig(slug: ThemeSlug, value: unknown): ThemeConfig {
  return getThemeDefinition(slug).configSchema.parse(value) as ThemeConfig;
}

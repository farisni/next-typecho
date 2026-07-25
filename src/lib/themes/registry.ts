import { defaultThemeDefinition } from "@/themes/default/definition";
import { handsomeThemeDefinition } from "@/themes/handsome/definition";
import { liteThemeDefinition } from "@/themes/lite/definition";
import { paperThemeDefinition } from "@/themes/paper/definition";
import type { DefaultThemeConfig } from "@/themes/default/definition";
import type { HandsomeThemeConfig } from "@/themes/handsome/definition";
import type { LiteThemeConfig } from "@/themes/lite/definition";
import type { PaperThemeConfig } from "@/themes/paper/definition";

export {
  defaultSidebarBlocks,
  defaultThemeConfigSchema,
  type DefaultSidebarBlock,
  type DefaultThemeConfig,
} from "@/themes/default/definition";
export {
  handsomeRightSidebarBlocks,
  handsomeThemeConfigSchema,
  type HandsomeRightSidebarBlock,
  type HandsomeThemeConfig,
} from "@/themes/handsome/definition";
export {
  handsomeRightSidebarBlocks as liteRightSidebarBlocks,
  liteThemeConfigSchema,
  type LiteRightSidebarBlock,
  type LiteThemeConfig,
} from "@/themes/lite/definition";
export {
  paperThemeConfigSchema,
  type PaperThemeConfig,
} from "@/themes/paper/definition";
export type {
  ThemeDefinition,
  ThemeSettingField,
  ThemeSourceFile,
} from "@/themes/types";

export const themeRegistry = {
  default: defaultThemeDefinition,
  handsome: handsomeThemeDefinition,
  lite: liteThemeDefinition,
  paper: paperThemeDefinition,
} as const;

export type ThemeSlug = keyof typeof themeRegistry;
export type ThemeConfig =
  | DefaultThemeConfig
  | HandsomeThemeConfig
  | LiteThemeConfig
  | PaperThemeConfig;

export const themeSlugs = Object.keys(themeRegistry) as ThemeSlug[];

export function isThemeSlug(value: unknown): value is ThemeSlug {
  return typeof value === "string" && Object.hasOwn(themeRegistry, value);
}

export function getThemeDefinition<TSlug extends ThemeSlug>(slug: TSlug) {
  return themeRegistry[slug];
}

export function getDefaultThemeConfig(slug: ThemeSlug): ThemeConfig {
  return structuredClone(themeRegistry[slug].defaults) as ThemeConfig;
}

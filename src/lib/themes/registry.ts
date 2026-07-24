import { classic22ThemeDefinition } from "@/themes/classic-22/definition";
import { defaultThemeDefinition } from "@/themes/default/definition";
import { handsomeThemeDefinition } from "@/themes/handsome/definition";

export {
  classicThemeConfigSchema,
  type ClassicThemeConfig,
} from "@/themes/classic-22/definition";
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
export type {
  ThemeDefinition,
  ThemeSettingField,
  ThemeSourceFile,
} from "@/themes/types";

export const themeRegistry = {
  default: defaultThemeDefinition,
  "classic-22": classic22ThemeDefinition,
  handsome: handsomeThemeDefinition,
} as const;

export type ThemeSlug = keyof typeof themeRegistry;
export type ThemeConfig =
  | typeof defaultThemeDefinition.defaults
  | typeof classic22ThemeDefinition.defaults
  | typeof handsomeThemeDefinition.defaults;

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

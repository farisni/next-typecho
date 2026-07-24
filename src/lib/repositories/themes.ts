import { get } from "@/lib/db";
import {
  getDefaultThemeConfig,
  isThemeSlug,
  type ClassicThemeConfig,
  type DefaultThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";
import { parseThemeConfig, themeCustomCssSchema } from "@/lib/validation/themes";

type ThemeSettingsRow = {
  configJson: string;
  customCss: string;
};

export type ResolvedTheme =
  | { slug: "default"; config: DefaultThemeConfig; customCss: string }
  | { slug: "classic-22"; config: ClassicThemeConfig; customCss: string };

export function getActiveThemeSlug(): ThemeSlug {
  const value = get<{ activeTheme: string }>(
    "SELECT active_theme AS activeTheme FROM site_settings WHERE id = 1",
  )?.activeTheme;
  return isThemeSlug(value) ? value : "default";
}

function getThemeSettingsRow(slug: ThemeSlug) {
  return get<ThemeSettingsRow>(
    "SELECT config_json AS configJson, custom_css AS customCss FROM theme_settings WHERE theme = ?",
    slug,
  );
}

function readStoredConfig(slug: ThemeSlug) {
  const row = getThemeSettingsRow(slug);
  if (!row) return { value: getDefaultThemeConfig(slug), customCss: "" };
  const customCssResult = themeCustomCssSchema.safeParse(row.customCss);
  const customCss = customCssResult.success ? customCssResult.data : "";

  try {
    return { value: JSON.parse(row.configJson) as unknown, customCss };
  } catch {
    return { value: getDefaultThemeConfig(slug), customCss };
  }
}

export function getResolvedTheme(slug: "default"): Extract<ResolvedTheme, { slug: "default" }>;
export function getResolvedTheme(slug: "classic-22"): Extract<ResolvedTheme, { slug: "classic-22" }>;
export function getResolvedTheme(slug: ThemeSlug): ResolvedTheme;
export function getResolvedTheme(slug: ThemeSlug): ResolvedTheme {
  const stored = readStoredConfig(slug);

  try {
    if (slug === "default") {
      return { slug, config: parseThemeConfig(slug, stored.value), customCss: stored.customCss };
    }
    return { slug, config: parseThemeConfig(slug, stored.value), customCss: stored.customCss };
  } catch {
    if (slug === "default") {
      return {
        slug,
        config: parseThemeConfig(slug, getDefaultThemeConfig(slug)),
        customCss: stored.customCss,
      };
    }
    return {
      slug,
      config: parseThemeConfig(slug, getDefaultThemeConfig(slug)),
      customCss: stored.customCss,
    };
  }
}

export function getActiveResolvedTheme() {
  return getResolvedTheme(getActiveThemeSlug());
}

import { get, run, transaction } from "@/lib/db";
import {
  getDefaultThemeConfig,
  isThemeSlug,
  type ThemeConfig,
  type ThemeSlug,
} from "@/lib/themes/registry";

function writeDefaultConfig(slug: ThemeSlug, now: number) {
  run(
    `INSERT INTO theme_settings (theme, config_json, custom_css, created_at, updated_at)
     VALUES (?, ?, '', ?, ?)
     ON CONFLICT(theme) DO UPDATE SET
       config_json = excluded.config_json,
       updated_at = excluded.updated_at`,
    slug,
    JSON.stringify(getDefaultThemeConfig(slug)),
    now,
    now,
  );
}

export function activateTheme(slug: ThemeSlug) {
  const now = Date.now();
  transaction(() => {
    const activeTheme = get<{ activeTheme: string }>(
      "SELECT active_theme AS activeTheme FROM site_settings WHERE id = 1",
    )?.activeTheme;
    if (!activeTheme) throw new Error("站点设置不存在");
    if (activeTheme === slug) return;

    // 与原版一致：切换外观会清除旧外观配置，并用新外观默认值初始化。
    if (isThemeSlug(activeTheme)) {
      writeDefaultConfig(activeTheme, now);
    }
    writeDefaultConfig(slug, now);
    run(
      "UPDATE site_settings SET active_theme = ?, updated_at = ? WHERE id = 1",
      slug,
      now,
    );
  });
}

export function saveThemeConfig(slug: ThemeSlug, config: ThemeConfig) {
  const activeTheme = get<{ activeTheme: string }>(
    "SELECT active_theme AS activeTheme FROM site_settings WHERE id = 1",
  )?.activeTheme;
  if (activeTheme !== slug) throw new Error("只能设置当前启用的外观");

  const now = Date.now();
  run(
    `INSERT INTO theme_settings (theme, config_json, custom_css, created_at, updated_at)
     VALUES (?, ?, '', ?, ?)
     ON CONFLICT(theme) DO UPDATE SET
       config_json = excluded.config_json,
       updated_at = excluded.updated_at`,
    slug,
    JSON.stringify(config),
    now,
    now,
  );
}

export function saveThemeCustomCss(slug: ThemeSlug, customCss: string) {
  const now = Date.now();
  run(
    `INSERT INTO theme_settings (theme, config_json, custom_css, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(theme) DO UPDATE SET
       custom_css = excluded.custom_css,
       updated_at = excluded.updated_at`,
    slug,
    JSON.stringify(getDefaultThemeConfig(slug)),
    customCss,
    now,
    now,
  );
}

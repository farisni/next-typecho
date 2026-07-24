import { existsSync, rmSync } from "node:fs";
import path from "node:path";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

async function main() {
  const databasePath = path.join(process.cwd(), "data", `theme-verification-${process.pid}.db`);
  process.env.DATABASE_URL = databasePath;

  const cleanup = () => {
    for (const suffix of ["", "-wal", "-shm"]) {
      const file = `${databasePath}${suffix}`;
      if (existsSync(file)) rmSync(file, { force: true });
    }
  };

  cleanup();
  try {
    const { initializeDatabaseSchema } = await import("../src/lib/bootstrap/install-state");
    initializeDatabaseSchema();
    const { installSite } = await import("../src/lib/bootstrap/install-service");
    await installSite({
      siteUrl: "http://localhost:3300",
      username: "theme-admin",
      password: "theme-admin-password",
      email: "theme@example.com",
    });

    const {
      getActiveThemeSlug,
      getResolvedTheme,
    } = await import("../src/lib/repositories/themes");
    const {
      activateTheme,
      saveThemeConfig,
      saveThemeCustomCss,
    } = await import("../src/lib/themes/service");
    const {
      defaultThemeConfigSchema,
      themeCustomCssSchema,
    } = await import("../src/lib/validation/themes");

    assert(getActiveThemeSlug() === "default", "新站点应默认启用 Default 外观");
    saveThemeConfig("default", {
      logoUrl: "https://example.com/logo.png",
      sidebarBlocks: ["ShowRecentPosts", "ShowOther"],
    });
    saveThemeCustomCss("default", ".theme-default { --verified: 1; }");
    let defaultTheme = getResolvedTheme("default");
    assert(defaultTheme.config.sidebarBlocks.length === 2, "Default 外观设置未保存");
    assert(defaultTheme.customCss.includes("--verified"), "自定义 CSS 未保存");

    activateTheme("classic-22");
    assert(getActiveThemeSlug() === "classic-22", "Classic 22 未成功启用");
    defaultTheme = getResolvedTheme("default");
    assert(defaultTheme.config.sidebarBlocks.length === 5, "切换外观后旧配置未恢复默认值");
    assert(defaultTheme.customCss.includes("--verified"), "切换外观不应删除 custom.css");

    saveThemeConfig("classic-22", {
      logoUrl: "",
      colorSchema: "dark",
    });
    const classicTheme = getResolvedTheme("classic-22");
    assert(classicTheme.config.colorSchema === "dark", "Classic 22 配色设置未保存");

    assert(
      !defaultThemeConfigSchema.safeParse({ logoUrl: "javascript:alert(1)", sidebarBlocks: [] }).success,
      "主题 LOGO 不应接受非 HTTP 协议",
    );
    assert(
      !themeCustomCssSchema.safeParse("</style><script>alert(1)</script>").success,
      "custom.css 不应允许闭合 style 标签",
    );

    const { database } = await import("../src/lib/db");
    database
      .prepare("UPDATE theme_settings SET custom_css = ? WHERE theme = 'classic-22'")
      .run("</style><script>alert(1)</script>");
    assert(getResolvedTheme("classic-22").customCss === "", "读取侧未过滤非法 custom.css");
    database.close();
    console.log("Theme verification passed.");
  } finally {
    cleanup();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

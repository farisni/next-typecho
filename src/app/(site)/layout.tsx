import { ThemeSiteShell } from "@/components/themes/theme-site-shell";
import { getCurrentUser } from "@/lib/auth/session";
import { requireInstallation } from "@/lib/bootstrap/install-guard";
import { getSiteSettings } from "@/lib/repositories/settings";
import { resolveThemeForRequest } from "@/lib/themes/request";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  requireInstallation();
  // HttpOnly 会话和预览 Cookie 只在服务端解析，游客不会看到管理员正在预览的外观。
  const user = await getCurrentUser();
  const [settings, theme] = await Promise.all([
    getSiteSettings(),
    resolveThemeForRequest(user),
  ]);

  return (
    <ThemeSiteShell
      name={settings.siteName}
      description={settings.siteDescription}
      user={user}
      theme={theme}
      boxModel={settings.boxModel}
    >
      {children}
    </ThemeSiteShell>
  );
}

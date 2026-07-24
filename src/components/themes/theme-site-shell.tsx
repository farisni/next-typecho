import Link from "next/link";
import { stopThemePreview } from "@/actions/themes";
import type { AuthUser } from "@/lib/auth/session";
import type { resolveThemeForRequest } from "@/lib/themes/request";
import { Classic22Footer } from "@/components/themes/classic-22-footer";
import { Classic22Header } from "@/components/themes/classic-22-header";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteSidebar } from "@/components/site/site-sidebar";

function ThemePreviewBar({ title }: { title: string }) {
  return (
    <div className="theme-preview-bar" role="status">
      <span>正在预览 <strong>{title}</strong></span>
      <Link href="/admin/themes">返回外观管理</Link>
      <form action={stopThemePreview}><button type="submit">停止预览</button></form>
    </div>
  );
}

export function ThemeSiteShell({
  name,
  description,
  user,
  theme,
  children,
}: {
  name: string;
  description: string;
  user: AuthUser | null;
  theme: Awaited<ReturnType<typeof resolveThemeForRequest>>;
  children: React.ReactNode;
}) {
  const customStyle = theme.customCss ? <style data-theme-custom-css>{theme.customCss}</style> : null;

  if (theme.slug === "classic-22") {
    return (
      <div className="theme-classic-22" data-theme={theme.config.colorSchema}>
        {customStyle}
        {theme.isPreview && <ThemePreviewBar title="Classic 22" />}
        <Classic22Header
          name={name}
          description={description}
          logoUrl={theme.config.logoUrl}
        />
        <main className="classic-container classic-main">
          <div className="classic-container-thin">{children}</div>
        </main>
        <Classic22Footer siteName={name} />
      </div>
    );
  }

  return (
    <div className="theme-site theme-default">
      {customStyle}
      {theme.isPreview && <ThemePreviewBar title="Typecho Replica Theme" />}
      <SiteHeader name={name} description={description} logoUrl={theme.config.logoUrl} />
      <div id="body">
        <div className="theme-container">
          <div className="content-row">
            <main id="main">{children}</main>
            <SiteSidebar user={user} config={theme.config} />
          </div>
        </div>
      </div>
      <SiteFooter siteName={name} />
    </div>
  );
}

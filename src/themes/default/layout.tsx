import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { SiteSidebar } from "@/components/site/site-sidebar";
import type { DefaultThemeConfig } from "@/themes/default/definition";
import type { ThemeLayoutProps } from "@/themes/types";

export function DefaultThemeLayout({
  name,
  description,
  user,
  config,
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<DefaultThemeConfig>) {
  return (
    <div className="theme-site theme-default">
      {customStyle}
      {previewBar}
      <SiteHeader name={name} description={description} logoUrl={config.logoUrl} />
      <div id="body">
        <div className="theme-container">
          <div className="content-row">
            <main id="main">{children}</main>
            <SiteSidebar user={user} config={config} />
          </div>
        </div>
      </div>
      <SiteFooter siteName={name} />
    </div>
  );
}

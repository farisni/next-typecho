import "lxgw-wenkai-webfont/lxgwwenkai-regular.css";
import "lxgw-wenkai-webfont/lxgwwenkai-bold.css";
import type { LiteThemeConfig } from "@/themes/lite/definition";
import { BlogHeader } from "@/themes/lite/blog-header";
import { Footer } from "@/themes/lite/footer";
import { Header } from "@/themes/lite/header";
import { MainContent } from "@/themes/lite/main-content";
import { RightSidebar } from "@/themes/lite/right-sidebar";
import { Sidebar } from "@/themes/lite/sidebar";
import type { ThemeLayoutProps } from "@/themes/types";

export function LiteThemeLayout({
  name,
  description,
  user,
  config,
  boxModel,
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<LiteThemeConfig>) {
  return (
    <div
      className={
        config.colorScheme === "mint"
          ? `theme-lite theme-handsome handsome-color-mint${boxModel ? " handsome-box-model" : ""}`
          : `theme-lite theme-handsome${boxModel ? " handsome-box-model" : ""}`
      }
    >
      {customStyle}
      {previewBar}
      <div className="handsome-topbar">
        <div className="handsome-topbar-sidebar">
          <span className="lite-brand">{name}</span>
        </div>
        <Header colorScheme={config.colorScheme} />
      </div>
      <Sidebar name={name} logoUrl={config.logoUrl} user={user} />
      <div className="handsome-workspace">
        <BlogHeader name={name} description={description} />
        <div className="handsome-content-grid">
          <MainContent>{children}</MainContent>
          <RightSidebar description={description} config={config} />
        </div>
        <Footer />
      </div>
    </div>
  );
}

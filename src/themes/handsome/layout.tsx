import "lxgw-wenkai-webfont/lxgwwenkai-regular.css";
import "lxgw-wenkai-webfont/lxgwwenkai-bold.css";
import type { HandsomeThemeConfig } from "@/themes/handsome/definition";
import { BlogHeader } from "@/themes/handsome/blog-header";
import { Footer } from "@/themes/handsome/footer";
import { Header } from "@/themes/handsome/header";
import { MainContent } from "@/themes/handsome/main-content";
import { RightSidebar } from "@/themes/handsome/right-sidebar";
import { Sidebar } from "@/themes/handsome/sidebar";
import type { ThemeLayoutProps } from "@/themes/types";

export function HandsomeThemeLayout({
  name,
  description,
  user,
  config,
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<HandsomeThemeConfig>) {
  return (
    <div
      className={
        config.colorScheme === "mint"
          ? "theme-handsome handsome-color-mint"
          : "theme-handsome"
      }
    >
      {customStyle}
      {previewBar}
      <div className="handsome-topbar">
        <div className="handsome-topbar-sidebar" aria-hidden="true" />
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

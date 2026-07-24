import type { HandsomeThemeConfig } from "@/themes/handsome/definition";
import { BlogHeader } from "@/themes/handsome/blog-header";
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
    <div className="theme-handsome">
      {customStyle}
      {previewBar}
      <Sidebar name={name} logoUrl={config.logoUrl} user={user} />
      <div className="handsome-workspace">
        <Header />
        <BlogHeader name={name} description={description} />
        <div className="handsome-content-grid">
          <MainContent>{children}</MainContent>
          <RightSidebar description={description} config={config} />
        </div>
      </div>
    </div>
  );
}

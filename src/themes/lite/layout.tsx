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
  customStyle,
  previewBar,
  children,
}: ThemeLayoutProps<LiteThemeConfig>) {
  // Lite 固定使用当前本地的紧凑结构；boxModel 仅保留给 Handsome 主题，
  // 避免后台切换 0/1 时改变 Lite 的页面网格。
  const themeClassName =
    config.colorScheme === "mint"
      ? "theme-lite theme-handsome handsome-color-mint handsome-box-model"
      : "theme-lite theme-handsome handsome-box-model";

  return (
    <div className={themeClassName}>
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
          <div className="lite-content-column">
            <MainContent>{children}</MainContent>
            <Footer />
          </div>
          <RightSidebar description={description} config={config} />
        </div>
      </div>
    </div>
  );
}

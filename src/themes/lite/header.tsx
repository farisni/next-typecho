import {
  Menu,
  Search,
} from "lucide-react";
import { HeaderScrollProgress } from "@/themes/lite/header-scroll-progress";
import { LiteThemeToggle } from "@/themes/lite/theme-toggle";
import { SystemDataPanel } from "@/themes/lite/system-data-panel";

export function Header() {
  return (
    <header className="handsome-header">
      <button className="handsome-mobile-menu" type="button" aria-label="打开菜单">
        <Menu aria-hidden="true" />
      </button>
      <div className="handsome-header-dashboard">
        <SystemDataPanel />
      </div>
      <span className="lite-header-spacer" />
      <div className="handsome-header-actions">
        <form className="handsome-search" action="/" role="search">
          <Search aria-hidden="true" />
          <label className="sr-only" htmlFor="handsome-search-input">搜索文章</label>
          <input
            id="handsome-search-input"
            name="q"
            type="search"
            placeholder="搜索文章"
          />
        </form>
        <LiteThemeToggle />
      </div>
      <HeaderScrollProgress />
    </header>
  );
}

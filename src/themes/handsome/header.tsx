import {
  Activity,
  Clock3,
  Menu,
  Moon,
  Search,
  TrendingUp,
} from "lucide-react";
import {
  ColorSchemeMenu,
  type HandsomeColorScheme,
} from "@/themes/handsome/color-scheme-menu";
import { HeaderScrollProgress } from "@/themes/handsome/header-scroll-progress";

export function Header({
  colorScheme,
}: {
  colorScheme: HandsomeColorScheme;
}) {
  return (
    <header className="handsome-header">
      <button className="handsome-mobile-menu" type="button" aria-label="打开菜单">
        <Menu aria-hidden="true" />
      </button>
      <div className="handsome-tools" aria-label="工具栏">
        <span><Clock3 aria-hidden="true" /></span>
        <span><Activity aria-hidden="true" /></span>
        <span><TrendingUp aria-hidden="true" /></span>
        <span><Moon aria-hidden="true" /></span>
        <ColorSchemeMenu initialScheme={colorScheme} />
      </div>
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
      </div>
      <HeaderScrollProgress />
    </header>
  );
}

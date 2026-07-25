import {
  Menu,
  Search,
  KeyRound,
} from "lucide-react";
import type { HandsomeColorScheme } from "@/themes/lite/color-scheme-menu";
import { HeaderScrollProgress } from "@/themes/lite/header-scroll-progress";

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
      <span className="lite-header-spacer" data-color-scheme={colorScheme} />
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
        <a className="lite-admin-link" href="/admin" aria-label="进入后台">
          <KeyRound aria-hidden="true" />
        </a>
      </div>
      <HeaderScrollProgress />
    </header>
  );
}

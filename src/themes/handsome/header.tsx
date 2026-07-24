import {
  Activity,
  Clock3,
  Menu,
  Moon,
  Search,
  TrendingUp,
} from "lucide-react";

export function Header() {
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
    </header>
  );
}

import Link from "next/link";
import { SiteNav } from "@/components/site/site-nav";

type SiteHeaderProps = {
  name: string;
  description: string;
  logoUrl?: string;
};

export function SiteHeader({ name, description, logoUrl }: SiteHeaderProps) {
  return (
    <header id="header">
      <div className="theme-container">
        <div className="header-row">
          <div className="site-name">
            <Link id="logo" href="/">
              {logoUrl ? <img src={logoUrl} alt={name} /> : name}
            </Link>
            {!logoUrl && <p className="description">{description}</p>}
          </div>
          <div className="site-search">
            <form id="search" action="/" role="search">
              <label htmlFor="site-search-input" className="sr-only">搜索关键字</label>
              <input id="site-search-input" name="q" type="text" placeholder="输入关键字搜索" />
              <button type="submit" aria-label="搜索">⌕</button>
            </form>
          </div>
          <SiteNav />
        </div>
      </div>
    </header>
  );
}

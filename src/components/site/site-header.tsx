import Link from "next/link";
import { Rss, Search } from "lucide-react";
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
            <span className="site-logo-row">
              <Link id="logo" href="/">
                {logoUrl ? <img src={logoUrl} alt={name} /> : name}
              </Link>
              <Rss className="site-rss-icon" aria-hidden="true" strokeWidth={2.4} />
            </span>
            {!logoUrl && <p className="description">{description}</p>}
          </div>
          <div className="site-search">
            <form id="search" action="/" role="search">
              <label htmlFor="site-search-input" className="sr-only">搜索关键字</label>
              <input id="site-search-input" name="q" type="text" placeholder="输入关键字搜索" />
              <button type="submit" aria-label="搜索">
                <Search aria-hidden="true" />
              </button>
            </form>
          </div>
          <SiteNav />
        </div>
      </div>
    </header>
  );
}

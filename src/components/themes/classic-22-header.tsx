"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function Classic22Header({
  name,
  description,
  logoUrl,
}: {
  name: string;
  description: string;
  logoUrl: string;
}) {
  const pathname = usePathname();

  return (
    <header className="classic-navbar">
      <div className="classic-container classic-navbar-inner">
        <div className="classic-brand-group">
          <Link href="/" className="classic-brand">
            {logoUrl ? <img src={logoUrl} alt={name} /> : name}
          </Link>
          {!logoUrl && <span className="classic-description">{description}</span>}
        </div>
        <nav className="classic-nav" aria-label="主导航">
          <Link className={pathname === "/" ? "active" : undefined} href="/">首页</Link>
          <Link className={pathname === "/start-page.html" ? "active" : undefined} href="/start-page.html">关于</Link>
          <form action="/" role="search">
            <label className="sr-only" htmlFor="classic-search">搜索关键字</label>
            <input id="classic-search" type="search" name="q" placeholder="搜索" />
          </form>
        </nav>
      </div>
    </header>
  );
}

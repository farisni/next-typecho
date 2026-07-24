"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SiteNav() {
  const pathname = usePathname();

  return (
    <nav id="nav-menu" aria-label="主导航">
      <Link className={pathname === "/" ? "current" : undefined} href="/">首页</Link>
      <Link className={pathname === "/start-page.html" ? "current" : undefined} href="/start-page.html">关于</Link>
    </nav>
  );
}

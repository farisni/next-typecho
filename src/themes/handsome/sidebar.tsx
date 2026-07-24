import Link from "next/link";
import {
  FileText,
  GitFork,
  Home,
  Info,
  Radio,
  Rss,
  Settings,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth/session";

export function Sidebar({
  name,
  logoUrl,
  user,
}: {
  name: string;
  logoUrl: string;
  user: AuthUser | null;
}) {
  return (
    <aside className="handsome-sidebar" aria-label="博客导航">
      <Link className="handsome-identity" href="/">
        {logoUrl ? (
          <img src={logoUrl} alt={name} />
        ) : (
          <img src="/images/avatar.png" alt={name} />
        )}
      </Link>

      <nav className="handsome-nav">
        <Link href="/">
          <Home aria-hidden="true" />
          <span>首页</span>
        </Link>
        <Link href="/">
          <FileText aria-hidden="true" />
          <span>文章</span>
        </Link>
        <Link href="/start-page.html">
          <Info aria-hidden="true" />
          <span>关于</span>
        </Link>
      </nav>

      <div className="handsome-sidebar-footer handsome-sidebar-dock">
        <Link href="/feed.xml" aria-label="RSS 订阅">
          <Rss aria-hidden="true" />
        </Link>
        <Link href="/" aria-label="博客动态">
          <Radio aria-hidden="true" />
        </Link>
        <Link href={user ? "/admin" : "/login"} aria-label={user ? "进入后台" : "登录"}>
          <Settings aria-hidden="true" />
        </Link>
        <a href="https://github.com/farisni/next-typecho" aria-label="GitHub">
          <GitFork aria-hidden="true" />
        </a>
      </div>
    </aside>
  );
}

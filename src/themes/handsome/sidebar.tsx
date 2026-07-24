import Link from "next/link";
import {
  FileText,
  Home,
  Info,
  LayoutDashboard,
  LogIn,
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
          <span className="handsome-avatar" aria-hidden="true">
            {name.slice(0, 1).toUpperCase()}
          </span>
        )}
        <strong>{name}</strong>
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

      <div className="handsome-sidebar-footer">
        {user ? (
          <Link href="/admin">
            <LayoutDashboard aria-hidden="true" />
            <span>进入后台</span>
          </Link>
        ) : (
          <Link href="/login">
            <LogIn aria-hidden="true" />
            <span>登录</span>
          </Link>
        )}
      </div>
    </aside>
  );
}

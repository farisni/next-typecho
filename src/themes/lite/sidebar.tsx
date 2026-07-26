import Link from "next/link";
import {
  ChevronRight,
  CircleDot,
  FolderOpen,
  Home,
  Info,
} from "lucide-react";
import type { AuthUser } from "@/lib/auth/session";
import { get } from "@/lib/db";
import { getSidebarContent } from "@/lib/repositories/posts";

export function Sidebar({
  name,
  logoUrl,
  user,
}: {
  name: string;
  logoUrl: string;
  user: AuthUser | null;
}) {
  const { categories } = getSidebarContent();
  const ownerEmail = get<{ email: string }>(
    "SELECT email FROM users WHERE role = 'administrator' ORDER BY created_at ASC LIMIT 1",
  )?.email.trim();

  return (
    <aside className="handsome-sidebar" aria-label="博客导航">
      <Link className="handsome-identity" href="/">
        <span className="handsome-avatar-wrap">
          {logoUrl ? (
            <img src={logoUrl} alt={name} />
          ) : (
            <img src="/images/avatar.png" alt={name} />
          )}
          <span
            className="handsome-profile-status"
            data-status="vacation"
            title="度假中"
            aria-label="当前状态：度假中"
          />
        </span>
        <span className="handsome-identity-copy">
          <strong>{user?.displayName || "Faris"}</strong>
          {ownerEmail ? <span className="handsome-profile-email">{ownerEmail}</span> : null}
        </span>
      </Link>

      <nav className="handsome-nav lite-nav">
        <span className="lite-nav-label">导航</span>
        <Link href="/">
          <Home aria-hidden="true" />
          <span>首页</span>
        </Link>
        <details className="lite-nav-group" open>
          <summary className="lite-nav-group-title">
            <FolderOpen aria-hidden="true" />
            <span>分类</span>
            <ChevronRight aria-hidden="true" />
          </summary>
          <div className="lite-category-list">
            {categories.map((category) => (
              <Link href={`/categories/${category.slug}`} key={category.slug}>
                <span>{category.name}</span>
                <small>{category.count}</small>
              </Link>
            ))}
          </div>
        </details>
        <Link href="/">
          <CircleDot aria-hidden="true" />
          <span>归档</span>
        </Link>
        <Link href="/start-page.html">
          <Info aria-hidden="true" />
          <span>关于</span>
        </Link>
      </nav>

    </aside>
  );
}

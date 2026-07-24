"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, UserRound } from "lucide-react";
import { logout } from "@/actions/auth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { AuthUser } from "@/lib/auth/session";

const items = [
  {
    label: "控制台",
    href: "/admin",
    match: (path: string) => path === "/admin" || path.startsWith("/admin/profile") || path.startsWith("/admin/themes"),
    children: [
      ["概要", "/admin"],
      ["个人设置", "/admin/profile"],
      ["外观", "/admin/themes"],
    ],
  },
  { label: "撰写", href: "/admin/posts/new", match: (path: string) => path === "/admin/posts/new" },
  {
    label: "管理",
    href: "/admin/posts",
    match: (path: string) => path.startsWith("/admin/posts") && path !== "/admin/posts/new" || path.startsWith("/admin/categories") || path.startsWith("/admin/tags"),
    children: [
      ["文章", "/admin/posts"],
      ["分类", "/admin/categories"],
      ["标签", "/admin/tags"],
    ],
  },
  { label: "设置", href: "/admin/settings", match: (path: string) => path.startsWith("/admin/settings") },
];

export function AdminNav({ user }: { user: AuthUser }) {
  const pathname = usePathname();

  return (
    <header className="typecho-head-nav" role="navigation">
      <nav>
        <details className="admin-menu-bar"><summary>菜单</summary></details>
        <menu>
          {items.map((item) => (
            <li key={item.href} className={item.match(pathname) ? "focus" : undefined}>
              <Link href={item.href}>{item.label}</Link>
              {item.children && <menu>{item.children.map(([label, href]) => <li key={href} className={pathname === href ? "focus" : undefined}><Link href={href}>{label}</Link></li>)}</menu>}
            </li>
          ))}
          <li className="operate">
            <Link href="/">网站</Link>
            <DropdownMenu>
              <DropdownMenuTrigger
                className="admin-avatar-trigger"
                aria-label={`${user.displayName} 的账户菜单`}
                title={user.lastLoginAt ? `最后登录: ${user.lastLoginAt.toLocaleString("zh-CN")}` : undefined}
              >
                <Avatar size="sm">
                  <AvatarFallback>{user.displayName.trim().slice(0, 1).toUpperCase()}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" sideOffset={8} className="admin-avatar-menu rounded-none">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                  <DropdownMenuItem render={<Link href="/admin/profile" />} className="rounded-none cursor-pointer">
                    <UserRound />
                    个人设置
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    className="rounded-none cursor-pointer"
                    onClick={() => { void logout(); }}
                  >
                    <LogOut />
                    退出登录
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </menu>
      </nav>
    </header>
  );
}

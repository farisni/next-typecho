import Link from "next/link";
import {
  Aperture,
  AtSign,
  Box,
  ChevronRight,
  FileText,
  GitFork,
  Home,
  Image as ImageIcon,
  Info,
  LayoutGrid,
  MessageSquare,
  Radio,
  Rss,
  Settings,
  Users,
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
          <span>Developer &amp; Blogger</span>
        </span>
      </Link>

      <nav className="handsome-nav">
        <Link href="/">
          <Home aria-hidden="true" />
          <span>首页</span>
        </Link>
        <Link href="#">
          <ImageIcon aria-hidden="true" />
          <span>相册</span>
        </Link>
        <Link href="#">
          <Box aria-hidden="true" />
          <span>游戏</span>
          <ChevronRight className="handsome-nav-chevron" aria-hidden="true" />
        </Link>
        <Link href="#">
          <AtSign aria-hidden="true" />
          <span>友情链接</span>
        </Link>
        <Link href="#">
          <Aperture aria-hidden="true" />
          <span>好友动态</span>
        </Link>
        <Link href="#">
          <Users aria-hidden="true" />
          <span>访客统计</span>
        </Link>
        <Link href="#">
          <MessageSquare aria-hidden="true" />
          <span>AI-Chats</span>
        </Link>
        <Link href="/start-page.html">
          <Info aria-hidden="true" />
          <span>关于</span>
          <ChevronRight className="handsome-nav-chevron" aria-hidden="true" />
        </Link>
        <span className="handsome-nav-divider" aria-hidden="true" />
        <Link href="#">
          <LayoutGrid aria-hidden="true" />
          <span>分类</span>
          <ChevronRight className="handsome-nav-chevron" aria-hidden="true" />
        </Link>
        <Link href="#">
          <FileText aria-hidden="true" />
          <span>页面</span>
          <ChevronRight className="handsome-nav-chevron" aria-hidden="true" />
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

"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, FileText, Home, LogIn, LogOut, Menu, Search, Settings, UserRound } from "lucide-react";
import { logoutFromSite } from "@/actions/auth";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { HeaderScrollProgress } from "@/themes/lite/header-scroll-progress";
import { LiteThemeToggle } from "@/themes/lite/theme-toggle";

const SystemDataPanel = dynamic(
  () => import("@/themes/lite/system-data-panel").then((module) => module.SystemDataPanel),
  {
    ssr: false,
    loading: () => (
      <div className="lite-system-data" aria-hidden="true">
        <span className="lite-system-data-tab lite-system-data-placeholder">
          <Activity />
        </span>
      </div>
    ),
  },
);

type HeaderUser = {
  displayName: string;
} | null;

type HeaderSearchPost = {
  title: string;
  slug: string;
  excerpt: string | null;
  categoryName: string | null;
  tags: string[];
};

export function Header({ user }: { user: HeaderUser }) {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [matchedPosts, setMatchedPosts] = useState<HeaderSearchPost[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);

  useEffect(() => {
    const query = searchQuery.trim();

    if (!query) {
      setMatchedPosts([]);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setSearchLoading(true);

      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("搜索请求失败");
        }

        const data = await response.json() as { items?: HeaderSearchPost[] };
        setMatchedPosts(Array.isArray(data.items) ? data.items : []);
      } catch (error) {
        if (!controller.signal.aborted) {
          setMatchedPosts([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setSearchLoading(false);
        }
      }
    }, 120);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery]);

  function closeCommand() {
    setCommandOpen(false);
    setSearchQuery("");
  }

  function submitSearch() {
    const query = searchQuery.trim();
    if (!query) return;
    closeCommand();
    router.push(`/?q=${encodeURIComponent(query)}`);
  }

  return (
    <>
      <header className="handsome-header">
        <button className="handsome-mobile-menu" type="button" aria-label="打开菜单">
          <Menu aria-hidden="true" />
        </button>
        <div className="handsome-header-dashboard">
          <SystemDataPanel canViewTraffic={Boolean(user)} />
        </div>
        <span className="lite-header-spacer" />
        <div className="handsome-header-actions">
          <button
            className="handsome-search"
            type="button"
            aria-label="搜索文章"
            title="搜索文章"
            onClick={() => setCommandOpen(true)}
          >
            <Search aria-hidden="true" />
          </button>
          <LiteThemeToggle />
          <DropdownMenu>
            <DropdownMenuTrigger
              className="lite-account-menu-trigger"
              aria-label={user ? `${user.displayName} 的账户菜单` : "账户菜单"}
              suppressHydrationWarning
            >
              <UserRound aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={10} className="lite-account-menu">
              {user ? (
                <>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel>{user.displayName}</DropdownMenuLabel>
                    <DropdownMenuItem render={<Link href="/admin" />} className="lite-account-menu-item">
                      <Settings aria-hidden="true" />
                      进入后台
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem
                      variant="destructive"
                      className="lite-account-menu-item"
                      onClick={() => { void logoutFromSite(); }}
                    >
                      <LogOut aria-hidden="true" />
                      退出登录
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </>
              ) : (
                <DropdownMenuGroup>
                  <DropdownMenuItem render={<Link href="/login" />} className="lite-account-menu-item">
                    <LogIn aria-hidden="true" />
                    进入后台
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <HeaderScrollProgress />
      </header>

      <CommandDialog
        open={commandOpen}
        className="lite-command-dialog"
        onOpenChange={(open) => {
          setCommandOpen(open);
          if (!open) setSearchQuery("");
        }}
      >
        <Command shouldFilter={false}>
          <CommandInput
            value={searchQuery}
            onValueChange={setSearchQuery}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                submitSearch();
              }
            }}
            placeholder="搜索文章..."
          />
          <CommandList>
            {searchQuery.trim() ? (
              <>
                <CommandGroup heading="搜索结果">
                  {searchLoading ? (
                    <CommandItem disabled className="items-center gap-2.5 [&>svg:last-child]:hidden">
                      <Search className="size-5 shrink-0" aria-hidden="true" />
                      <span className="text-muted-foreground">正在搜索...</span>
                    </CommandItem>
                  ) : matchedPosts.length ? (
                    matchedPosts.map((post) => (
                      <CommandItem
                        key={post.slug}
                        className="items-center gap-2.5 [&>svg:last-child]:hidden"
                        onSelect={() => { closeCommand(); router.push(`/posts/${post.slug}`); }}
                      >
                        <FileText className="size-5 shrink-0" aria-hidden="true" />
                        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                          <span className="truncate font-medium text-foreground">{post.title}</span>
                          <span className="truncate text-sm text-muted-foreground">
                            {post.excerpt || post.categoryName || `/posts/${post.slug}`}
                          </span>
                        </div>
                        <span className="lite-command-type rounded-lg border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                          {post.categoryName || "未分类"}
                        </span>
                      </CommandItem>
                    ))
                  ) : (
                    <CommandItem disabled className="items-center gap-2.5 [&>svg:last-child]:hidden">
                      <FileText className="size-5 shrink-0" aria-hidden="true" />
                      <span className="text-muted-foreground">没有匹配的文章</span>
                    </CommandItem>
                  )}
                </CommandGroup>
              </>
            ) : (
              <CommandGroup heading="站点">
                <CommandItem
                  className="items-center gap-2.5 [&>svg:last-child]:hidden"
                  onSelect={() => { closeCommand(); router.push("/"); }}
                >
                  <Home className="size-5 shrink-0" aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="shrink-0 font-medium text-foreground">首页</span>
                    <span className="truncate text-sm text-muted-foreground">/</span>
                  </div>
                  <span className="lite-command-type rounded-lg border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">PAGE</span>
                </CommandItem>
                <CommandItem
                  className="items-center gap-2.5 [&>svg:last-child]:hidden"
                  onSelect={() => { closeCommand(); router.push("/posts"); }}
                >
                  <FileText className="size-5 shrink-0" aria-hidden="true" />
                  <div className="flex min-w-0 flex-1 items-baseline gap-2">
                    <span className="shrink-0 font-medium text-foreground">全部文章</span>
                    <span className="truncate text-sm text-muted-foreground">/posts</span>
                  </div>
                  <span className="lite-command-type rounded-lg border border-border bg-background px-2 py-0.5 font-mono text-[11px] text-muted-foreground">PAGE</span>
                </CommandItem>
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FileText, Home, Menu, Search } from "lucide-react";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { HeaderScrollProgress } from "@/themes/lite/header-scroll-progress";
import { LiteThemeToggle } from "@/themes/lite/theme-toggle";
import { SystemDataPanel } from "@/themes/lite/system-data-panel";

export function Header() {
  const router = useRouter();
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

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
          <SystemDataPanel />
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
              <CommandEmpty>按 Enter 搜索文章</CommandEmpty>
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

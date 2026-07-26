"use client";

import { Gift, MessageSquare, ThumbsUp } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type TabKey = "popular" | "comments" | "recommend";

type TabConfig = {
  label: string;
  value: TabKey;
  icon: typeof ThumbsUp;
};

const tabs: TabConfig[] = [
  { label: "热门文章", value: "popular", icon: ThumbsUp },
  { label: "最新评论", value: "comments", icon: MessageSquare },
  { label: "推荐内容", value: "recommend", icon: Gift },
];

export function SidebarTabs() {
  return (
    <Tabs defaultValue="popular" aria-label="侧栏内容类型">
      <div className="handsome-sidebar-tabs-wrap">
        <TabsList variant="default" suppressHydrationWarning>
          {tabs.map(({ label, icon: Icon, value }) => (
            <TabsTrigger value={value} key={label} aria-label={label}>
              <Icon aria-hidden="true" />
              <span className="sr-only">{label}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
    </Tabs>
  );
}

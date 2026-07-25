"use client";

import { useState } from "react";
import { Gift, MessageSquare, ThumbsUp } from "lucide-react";

const tabs = [
  { label: "热门文章", icon: ThumbsUp },
  { label: "最新评论", icon: MessageSquare },
  { label: "推荐内容", icon: Gift },
];

export function SidebarTabs() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="handsome-sidebar-tabs" aria-label="侧栏内容类型">
      <span
        className="handsome-sidebar-tab-indicator"
        style={{ transform: `translateX(${activeTab * 100}%)` }}
        aria-hidden="true"
      />
      {tabs.map(({ label, icon: Icon }, index) => (
        <button
          className={activeTab === index ? "is-active" : undefined}
          key={label}
          type="button"
          aria-label={label}
          aria-pressed={activeTab === index}
          onClick={() => setActiveTab(index)}
        >
          <Icon aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

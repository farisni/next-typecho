"use client"

import dynamic from "next/dynamic";

const SidebarTabs = dynamic(
  () => import("./sidebar-tabs").then((mod) => mod.SidebarTabs),
  { ssr: false },
);

export function SidebarTabsClient() {
  return <SidebarTabs />;
}

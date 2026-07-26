"use client"

import dynamic from "next/dynamic";
import type { SidebarTabsProps } from "./sidebar-tabs";

const SidebarTabs = dynamic<SidebarTabsProps>(
  () => import("./sidebar-tabs").then((mod) => mod.SidebarTabs),
  { ssr: false },
);

export function SidebarTabsClient(props: SidebarTabsProps) {
  return <SidebarTabs {...props} />;
}

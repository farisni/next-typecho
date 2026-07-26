"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

const VISITOR_STORAGE_KEY = "next-typecho-visitor-id";
const RECENT_VISIT_KEY = "next-typecho-recent-visit";

function getVisitorId() {
  try {
    const existing = window.localStorage.getItem(VISITOR_STORAGE_KEY);
    if (existing) return existing;
    const visitorId = window.crypto.randomUUID();
    window.localStorage.setItem(VISITOR_STORAGE_KEY, visitorId);
    return visitorId;
  } catch {
    return `session-${window.crypto.randomUUID()}`;
  }
}

function shouldTrack(path: string) {
  try {
    const recent = JSON.parse(
      window.sessionStorage.getItem(RECENT_VISIT_KEY) ?? "null",
    ) as { path?: string; timestamp?: number } | null;
    const now = Date.now();
    if (recent?.path === path && now - (recent.timestamp ?? 0) < 2000) return false;
    window.sessionStorage.setItem(
      RECENT_VISIT_KEY,
      JSON.stringify({ path, timestamp: now }),
    );
  } catch {
    // 禁用存储时仍允许匿名统计。
  }
  return true;
}

function reportVisit(path: string) {
  if (!shouldTrack(path)) return;

  const payload = JSON.stringify({
    path,
    visitorId: getVisitorId(),
  });
  const body = new Blob([payload], { type: "application/json" });
  if (window.navigator.sendBeacon("/api/analytics/visit", body)) return;

  void fetch("/api/analytics/visit", {
    method: "POST",
    body: payload,
    headers: { "Content-Type": "application/json" },
    keepalive: true,
  }).catch(() => undefined);
}

export function TrafficTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;

    const browserWindow = window as typeof window & {
      requestIdleCallback?: (
        callback: () => void,
        options?: { timeout: number },
      ) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    const callback = () => reportVisit(pathname);

    if (browserWindow.requestIdleCallback) {
      const handle = browserWindow.requestIdleCallback(callback, { timeout: 1800 });
      return () => browserWindow.cancelIdleCallback?.(handle);
    }

    const handle = window.setTimeout(callback, 800);
    return () => window.clearTimeout(handle);
  }, [pathname]);

  return null;
}

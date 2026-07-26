import { createHash } from "node:crypto";
import { all, run, transaction } from "@/lib/db";

const FLUSH_INTERVAL_MS = 15_000;
const DEFAULT_TIME_ZONE = "Asia/Shanghai";

type QueuedBucket = {
  pageViews: number;
  visitors: Set<string>;
};

type TrafficQueueState = {
  buckets: Map<string, QueuedBucket>;
  timer?: NodeJS.Timeout;
  flushing: boolean;
};

export type TrafficDay = {
  date: string;
  pageViews: number;
  visitors: number;
};

export type TrafficSummary = {
  days: TrafficDay[];
  totals: {
    pageViews: number;
    visitors: number;
    todayPageViews: number;
    todayVisitors: number;
  };
  topPaths: Array<{
    path: string;
    pageViews: number;
  }>;
};

const globalForTraffic = globalThis as typeof globalThis & {
  trafficQueue?: TrafficQueueState;
};

const queueState =
  globalForTraffic.trafficQueue ??
  {
    buckets: new Map<string, QueuedBucket>(),
    flushing: false,
  };

globalForTraffic.trafficQueue = queueState;

const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: process.env.TRAFFIC_TIME_ZONE ?? DEFAULT_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function getDateKey(date = new Date()) {
  return dateFormatter.format(date);
}

function normalizePath(value: string) {
  const path = value.trim().split(/[?#]/, 1)[0] || "/";
  const normalized = path.startsWith("/") ? path : `/${path}`;
  if (
    normalized.length > 300 ||
    normalized.startsWith("/api/") ||
    normalized.startsWith("/_next/") ||
    normalized.startsWith("/admin") ||
    normalized.startsWith("/login") ||
    normalized.startsWith("/install")
  ) {
    return null;
  }
  return normalized !== "/" ? normalized.replace(/\/+$/, "") : normalized;
}

function hashVisitor(visitorId: string) {
  return createHash("sha256").update(visitorId).digest("hex").slice(0, 32);
}

function mergeBucket(target: QueuedBucket, source: QueuedBucket) {
  target.pageViews += source.pageViews;
  for (const visitor of source.visitors) target.visitors.add(visitor);
}

function scheduleFlush() {
  if (queueState.timer) return;
  queueState.timer = setTimeout(() => {
    queueState.timer = undefined;
    flushTrafficStats();
  }, FLUSH_INTERVAL_MS);
  queueState.timer.unref();
}

export function enqueueTrafficVisit(pathValue: string, visitorId: string) {
  const path = normalizePath(pathValue);
  const cleanVisitorId = visitorId.trim();
  if (!path || cleanVisitorId.length < 8 || cleanVisitorId.length > 128) return false;

  const date = getDateKey();
  const key = `${date}\u0000${path}`;
  const bucket = queueState.buckets.get(key) ?? {
    pageViews: 0,
    visitors: new Set<string>(),
  };
  bucket.pageViews += 1;
  bucket.visitors.add(hashVisitor(cleanVisitorId));
  queueState.buckets.set(key, bucket);
  scheduleFlush();
  return true;
}

export function flushTrafficStats() {
  if (queueState.flushing || queueState.buckets.size === 0) return;

  queueState.flushing = true;
  const snapshot = new Map(queueState.buckets);
  queueState.buckets.clear();

  try {
    const now = Date.now();
    transaction(() => {
      for (const [key, bucket] of snapshot) {
        const [date, path] = key.split("\u0000");
        run(
          `INSERT INTO traffic_daily (date, path, page_views, updated_at)
           VALUES (?, ?, ?, ?)
           ON CONFLICT(date, path) DO UPDATE SET
             page_views = traffic_daily.page_views + excluded.page_views,
             updated_at = excluded.updated_at`,
          date,
          path,
          bucket.pageViews,
          now,
        );

        for (const visitorHash of bucket.visitors) {
          run(
            `INSERT OR IGNORE INTO traffic_visitors
             (date, path, visitor_hash, created_at)
             VALUES (?, ?, ?, ?)`,
            date,
            path,
            visitorHash,
            now,
          );
        }
      }
    });
  } catch {
    for (const [key, bucket] of snapshot) {
      const queued = queueState.buckets.get(key);
      if (queued) mergeBucket(queued, bucket);
      else queueState.buckets.set(key, bucket);
    }
    scheduleFlush();
  } finally {
    queueState.flushing = false;
  }
}

function buildDateRange(days: number) {
  const result: string[] = [];
  const today = new Date();
  for (let index = days - 1; index >= 0; index -= 1) {
    result.push(getDateKey(new Date(today.getTime() - index * 86_400_000)));
  }
  return result;
}

export function getTrafficSummary(requestedDays = 365): TrafficSummary {
  flushTrafficStats();

  const dayCount = Math.max(7, Math.min(Math.trunc(requestedDays), 366));
  const dates = buildDateRange(dayCount);
  const fromDate = dates[0];

  const pageViewRows = all<{ date: string; pageViews: number }>(
    `SELECT date, SUM(page_views) AS pageViews
     FROM traffic_daily
     WHERE date >= ?
     GROUP BY date`,
    fromDate,
  );
  const visitorRows = all<{ date: string; visitors: number }>(
    `SELECT date, COUNT(DISTINCT visitor_hash) AS visitors
     FROM traffic_visitors
     WHERE date >= ?
     GROUP BY date`,
    fromDate,
  );
  const pageViewsByDate = new Map(pageViewRows.map((row) => [row.date, Number(row.pageViews)]));
  const visitorsByDate = new Map(visitorRows.map((row) => [row.date, Number(row.visitors)]));
  const days = dates.map((date) => ({
    date,
    pageViews: pageViewsByDate.get(date) ?? 0,
    visitors: visitorsByDate.get(date) ?? 0,
  }));
  const topPaths = all<{ path: string; pageViews: number }>(
    `SELECT path, SUM(page_views) AS pageViews
     FROM traffic_daily
     WHERE date >= ?
     GROUP BY path
     ORDER BY pageViews DESC
     LIMIT 6`,
    dates[Math.max(0, dates.length - 30)],
  ).map((row) => ({
    path: row.path,
    pageViews: Number(row.pageViews),
  }));
  const today = days.at(-1) ?? { pageViews: 0, visitors: 0 };

  return {
    days,
    totals: {
      pageViews: days.reduce((total, day) => total + day.pageViews, 0),
      visitors: days.reduce((total, day) => total + day.visitors, 0),
      todayPageViews: today.pageViews,
      todayVisitors: today.visitors,
    },
    topPaths,
  };
}

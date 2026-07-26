import "server-only";

import {
  getTrafficSummary,
  type TrafficSummary,
} from "@/lib/analytics/traffic";

const TRAFFIC_REFRESH_INTERVAL_MS = 60_000;
const TRAFFIC_SNAPSHOT_DAYS = 120;

type TrafficStatsCacheState = {
  started: boolean;
  snapshot?: {
    value: TrafficSummary;
    updatedAt: number;
  };
  refresh?: Promise<void>;
  timer?: NodeJS.Timeout;
};

const globalForTrafficStats = globalThis as typeof globalThis & {
  nextTypechoTrafficStats?: TrafficStatsCacheState;
};

const cacheState =
  globalForTrafficStats.nextTypechoTrafficStats ??
  {
    started: false,
  };

globalForTrafficStats.nextTypechoTrafficStats = cacheState;

export function refreshTrafficStatsSnapshot() {
  if (cacheState.refresh) return cacheState.refresh;

  cacheState.refresh = Promise.resolve()
    .then(() => getTrafficSummary(TRAFFIC_SNAPSHOT_DAYS))
    .then((value) => {
      cacheState.snapshot = { value, updatedAt: Date.now() };
    })
    .catch((error) => {
      console.error("[stats-cache] 访问统计快照刷新失败", error);
    })
    .finally(() => {
      cacheState.refresh = undefined;
    });

  return cacheState.refresh;
}

export async function startTrafficStatsSnapshotCache() {
  if (cacheState.started) {
    await cacheState.refresh;
    return;
  }

  cacheState.started = true;
  await refreshTrafficStatsSnapshot();
  cacheState.timer = setInterval(() => {
    void refreshTrafficStatsSnapshot();
  }, TRAFFIC_REFRESH_INTERVAL_MS);
  cacheState.timer.unref();
}

export function getTrafficStatsSnapshot() {
  return cacheState.snapshot ?? null;
}

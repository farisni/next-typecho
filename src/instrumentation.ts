export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { rebuildSearchCache } = await import("./lib/search-cache");
  const { count } = rebuildSearchCache();
  console.info(`[search-cache] 已构建 ${count} 篇文章的搜索缓存`);

  const { startTrafficStatsSnapshotCache } = await import(
    "./lib/traffic-stats-snapshot-cache"
  );
  await startTrafficStatsSnapshotCache();
  console.info("[stats-cache] 访问统计快照已启动");
}

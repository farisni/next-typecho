import { cpus, loadavg } from "node:os";
import process from "node:process";
import si from "systeminformation";
import { getSearchCacheStats } from "@/lib/search-cache";

export async function GET() {
  const [load, memory, fileSystems, osInfo, defaultNetworkInterface] =
    await Promise.all([
      si.currentLoad(),
      si.mem(),
      si.fsSize(),
      si.osInfo(),
      si.networkInterfaceDefault(),
    ]);
  const network = defaultNetworkInterface
    ? await si.networkStats(defaultNetworkInterface)
    : [];

  const cwd = process.cwd();
  const fileSystem =
    (osInfo.platform === "darwin"
      ? fileSystems.find((entry) => entry.mount === "/System/Volumes/Data")
      : undefined) ??
    fileSystems
      .filter((entry) => entry.mount !== "/" && cwd.startsWith(entry.mount))
      .sort((left, right) => right.mount.length - left.mount.length)[0] ??
    fileSystems.find((entry) => entry.mount === "/") ??
    fileSystems[0];
  const activeMemory = memory.active || memory.used;
  const heap = process.memoryUsage();
  const articleCache = getSearchCacheStats();
  const [loadOne, loadFive, loadFifteen] = loadavg();
  const networkSummary = network.reduce(
    (summary, item) => ({
      rxBytes: summary.rxBytes + Math.max(item.rx_bytes, 0),
      txBytes: summary.txBytes + Math.max(item.tx_bytes, 0),
      rxSec: summary.rxSec + Math.max(item.rx_sec, 0),
      txSec: summary.txSec + Math.max(item.tx_sec, 0),
    }),
    { rxBytes: 0, txBytes: 0, rxSec: 0, txSec: 0 },
  );

  return Response.json(
    {
      cpu: load.currentLoad,
      cpuCores: Math.max(cpus().length, 1),
      memory: {
        used: activeMemory,
        total: memory.total,
        percent: memory.total > 0 ? (activeMemory / memory.total) * 100 : 0,
      },
      articleCache,
      disk: {
        used: fileSystem ? fileSystem.size - fileSystem.available : 0,
        available: fileSystem?.available ?? 0,
        total: fileSystem?.size ?? 0,
        percent:
          fileSystem && fileSystem.size > 0
            ? ((fileSystem.size - fileSystem.available) / fileSystem.size) * 100
            : 0,
      },
      processMemory: {
        used: heap.heapUsed,
        total: heap.heapTotal,
        percent: heap.heapTotal > 0 ? (heap.heapUsed / heap.heapTotal) * 100 : 0,
      },
      network: {
        ...networkSummary,
        interface: defaultNetworkInterface || "未知接口",
      },
      load: {
        one: loadOne ?? 0,
        five: loadFive ?? 0,
        fifteen: loadFifteen ?? 0,
      },
      uptime: si.time().uptime,
      platform: `${osInfo.distro || osInfo.platform} ${osInfo.release} ${osInfo.arch}`,
      runtime: process.version,
      serverTime: new Date().toISOString(),
    },
    {
      headers: {
        "Cache-Control": "no-store",
      },
    },
  );
}

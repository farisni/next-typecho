"use client";

import {
  Activity,
  ChevronDown,
  Clock3,
  Cpu,
  Database,
  Gauge,
  Globe2,
  HardDrive,
  Languages,
  LockKeyhole,
  MapPin,
  MemoryStick,
  Monitor,
  Network,
  Server,
  Wifi,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

type RuntimeStats = {
  cpu: number;
  memory: number;
  disk: number;
  cache: number;
  load: number;
  memoryDetail: string;
  diskDetail: string;
  cacheDetail: string;
  uptime: string;
  platform: string;
  runtime: string;
  serverTime: string;
  networkTotal: string;
  networkRealtime: string;
};

type VisitorData = {
  browser: string;
  device: string;
  language: string;
  connection: string;
  domain: string;
  timezone: string;
};

const initialStats: RuntimeStats = {
  cpu: 0,
  memory: 0,
  disk: 0,
  cache: 0,
  load: 0,
  memoryDetail: "读取中",
  diskDetail: "读取中",
  cacheDetail: "读取中",
  uptime: "读取中",
  platform: "读取中",
  runtime: "读取中",
  serverTime: "读取中",
  networkTotal: "读取中",
  networkRealtime: "读取中",
};

const initialVisitor: VisitorData = {
  browser: "--",
  device: "--",
  language: "--",
  connection: "--",
  domain: "--",
  timezone: "--",
};

function MetricRow({
  icon: Icon,
  label,
  detail,
  value,
  tone = "green",
}: {
  icon: typeof Cpu;
  label: string;
  detail?: string;
  value: number;
  tone?: "green" | "yellow";
}) {
  return (
    <div className="lite-data-metric">
      <div className="lite-data-row">
        <span className="lite-data-label">
          <Icon aria-hidden="true" />
          <span>{label}</span>
          {detail ? <small>{detail}</small> : null}
        </span>
        <strong>{value.toFixed(value < 1 ? 2 : 1)}%</strong>
      </div>
      <span className="lite-data-progress" aria-hidden="true">
        <span
          className={tone === "yellow" ? "is-warning" : undefined}
          style={{ width: `${Math.max(1, Math.min(value, 100))}%` }}
        />
      </span>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Cpu;
  label: string;
  value: string;
}) {
  return (
    <div className="lite-data-info-row">
      <span className="lite-data-label">
        <Icon aria-hidden="true" />
        <span>{label}</span>
      </span>
      <strong>{value}</strong>
    </div>
  );
}

function detectBrowser(userAgent: string) {
  if (userAgent.includes("Edg/")) return "Microsoft Edge";
  if (userAgent.includes("Chrome/")) return "Google Chrome";
  if (userAgent.includes("Firefox/")) return "Firefox";
  if (userAgent.includes("Safari/")) return "Safari";
  return "未知浏览器";
}

function detectDevice(userAgent: string) {
  if (/iPhone|iPad|iPod/i.test(userAgent)) return "iOS";
  if (/Android/i.test(userAgent)) return "Android";
  if (/Macintosh|Mac OS X/i.test(userAgent)) return "macOS";
  if (/Windows/i.test(userAgent)) return "Windows";
  if (/Linux/i.test(userAgent)) return "Linux";
  return "未知设备";
}

function formatBytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex >= 3 ? 2 : 1)}${units[unitIndex]}`;
}

function formatDiskBytes(value: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let size = value;
  let unitIndex = 0;

  while (size >= 1000 && unitIndex < units.length - 1) {
    size /= 1000;
    unitIndex += 1;
  }

  return `${size.toFixed(unitIndex >= 3 ? 2 : 1)} ${units[unitIndex]}`;
}

function formatUptime(totalSeconds: number) {
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${days} 天 ${hours} 时 ${minutes} 分`;
}

export function SystemDataPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState("--");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [visitor, setVisitor] = useState<VisitorData>(initialVisitor);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const connection = (
      window.navigator as Navigator & {
        connection?: { effectiveType?: string };
      }
    ).connection;

    setVisitor({
      browser: detectBrowser(userAgent),
      device: detectDevice(userAgent),
      language: window.navigator.language,
      connection: connection?.effectiveType?.toUpperCase() ?? "在线",
      domain: window.location.host,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    });
  }, []);

  useEffect(() => {
    if (!open) return;

    const updateClock = () => {
      setNow(
        new Intl.DateTimeFormat("zh-CN", {
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }).format(new Date()),
      );
    };

    const updateSystemStats = async () => {
      try {
        const response = await fetch("/api/system-stats", {
          cache: "no-store",
        });
        if (!response.ok) return;

        const data = (await response.json()) as {
          cpu: number;
          memory: { used: number; total: number; percent: number };
          disk: {
            used: number;
            available: number;
            total: number;
            percent: number;
          };
          processMemory: { used: number; total: number; percent: number };
          network: {
            rxBytes: number;
            txBytes: number;
            rxSec: number;
            txSec: number;
            interface: string;
          };
          load: number;
          uptime: number;
          platform: string;
          runtime: string;
          serverTime: string;
        };

        setStats({
          cpu: data.cpu,
          memory: data.memory.percent,
          disk: data.disk.percent,
          cache: data.processMemory.percent,
          load: data.load,
          memoryDetail: `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`,
          diskDetail: `可用 ${formatDiskBytes(data.disk.available)} / 共 ${formatDiskBytes(data.disk.total)}`,
          cacheDetail: `${formatBytes(data.processMemory.used)} / ${formatBytes(data.processMemory.total)}`,
          uptime: formatUptime(data.uptime),
          platform: data.platform,
          runtime: data.runtime,
          serverTime: new Date(data.serverTime).toLocaleString("zh-CN", {
            hour12: false,
          }),
          networkTotal: `${data.network.interface}  ↑ ${formatBytes(data.network.txBytes)}  ↓ ${formatBytes(data.network.rxBytes)}`,
          networkRealtime: `↑ ${formatBytes(data.network.txSec)}/s  ↓ ${formatBytes(data.network.rxSec)}/s`,
        });
      } catch {
        setStats((current) => ({
          ...current,
          memoryDetail: "读取失败",
          diskDetail: "读取失败",
          cacheDetail: "读取失败",
        }));
      }
    };

    updateClock();
    void updateSystemStats();
    const clockTimer = window.setInterval(updateClock, 1000);
    const statsTimer = window.setInterval(() => {
      void updateSystemStats();
    }, 3000);

    return () => {
      window.clearInterval(clockTimer);
      window.clearInterval(statsTimer);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("pointerdown", closeOnOutsideClick);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutsideClick);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, [open]);

  return (
    <div ref={rootRef} className="lite-system-data">
      <button
        className={open ? "lite-system-data-trigger is-open" : "lite-system-data-trigger"}
        type="button"
        aria-label="查看运行数据"
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <Activity aria-hidden="true" />
        <ChevronDown aria-hidden="true" />
      </button>

      {open ? (
        <section className="lite-system-data-panel" role="dialog" aria-label="站点运行数据">
          <div className="lite-data-column">
            <h2>运行状态</h2>
            <MetricRow icon={Cpu} label="CPU 占用" detail="系统实时" value={stats.cpu} />
            <MetricRow icon={MemoryStick} label="占用内存" detail={stats.memoryDetail} value={stats.memory} />
            <MetricRow icon={HardDrive} label="磁盘占用" detail={stats.diskDetail} value={stats.disk} tone="yellow" />
            <MetricRow icon={Database} label="Node 堆内存" detail={stats.cacheDetail} value={stats.cache} />
            <MetricRow icon={Gauge} label="系统负载" detail="1 分钟均值" value={stats.load} />
          </div>

          <div className="lite-data-column">
            <h2>网络状态</h2>
            <InfoRow icon={Network} label="网络 I/O" value={stats.networkTotal} />
            <InfoRow icon={Wifi} label="实时网络" value={stats.networkRealtime} />
            <InfoRow icon={Clock3} label="服务器时间" value={stats.serverTime === "读取中" ? now : stats.serverTime} />
            <InfoRow icon={Server} label="WEB 服务器" value="Next.js 16" />
            <InfoRow icon={Globe2} label="通信协议" value="HTTP/2" />
            <InfoRow icon={Cpu} label="运行环境" value={stats.runtime} />
            <InfoRow icon={Monitor} label="系统信息" value={stats.platform} />
          </div>

          <div className="lite-data-column">
            <h2>访客信息</h2>
            <InfoRow icon={Clock3} label="持续运行" value={stats.uptime} />
            <InfoRow icon={MapPin} label="网络位置" value={visitor.timezone} />
            <InfoRow icon={Globe2} label="浏览器信息" value={visitor.browser} />
            <InfoRow icon={Monitor} label="您的设备" value={visitor.device} />
            <InfoRow icon={Network} label="网络类型" value={visitor.connection} />
            <InfoRow icon={Languages} label="服务语言" value={visitor.language} />
            <InfoRow icon={LockKeyhole} label="连接类型" value="HTTPS" />
            <InfoRow icon={Server} label="当前域名" value={visitor.domain} />
          </div>
        </section>
      ) : null}
    </div>
  );
}

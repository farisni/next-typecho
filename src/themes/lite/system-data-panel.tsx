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
  cpu: 0.48,
  memory: 54.62,
  disk: 70.06,
  cache: 36.64,
  load: 8.5,
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

export function SystemDataPanel() {
  const rootRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState("--");
  const [uptime, setUptime] = useState("--");
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

    const updateData = () => {
      const elapsedSeconds = Math.floor(window.performance.now() / 1000);
      const minutes = Math.floor(elapsedSeconds / 60);
      const seconds = elapsedSeconds % 60;
      const pulse = Math.sin(Date.now() / 7000);

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
      setUptime(`${minutes} 分 ${seconds.toString().padStart(2, "0")} 秒`);
      setStats({
        cpu: Math.max(0.2, 2.4 + pulse * 1.8),
        memory: 54.62,
        disk: 70.06,
        cache: 36.64,
        load: Math.max(2, 8.5 + pulse * 2.2),
      });
    };

    updateData();
    const timer = window.setInterval(updateData, 1000);
    return () => window.clearInterval(timer);
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
            <MetricRow icon={Cpu} label="CPU 占用" detail="浏览器会话" value={stats.cpu} />
            <MetricRow icon={MemoryStick} label="占用内存" detail="913.71MB / 1.63GB" value={stats.memory} />
            <MetricRow icon={HardDrive} label="磁盘占用" detail="39.12GB / 55.84GB" value={stats.disk} tone="yellow" />
            <MetricRow icon={Database} label="内存缓存" detail="612.97MB / 1.63GB" value={stats.cache} />
            <MetricRow icon={Gauge} label="系统负载" detail="0.17  0.15  0.16" value={stats.load} />
          </div>

          <div className="lite-data-column">
            <h2>网络状态</h2>
            <InfoRow icon={Network} label="网络 I/O" value="5.73GB / 5.73GB" />
            <InfoRow icon={Wifi} label="实时网络" value="1.42K/s / 1.91K/s" />
            <InfoRow icon={Clock3} label="服务器时间" value={now} />
            <InfoRow icon={Server} label="WEB 服务器" value="Next.js 16" />
            <InfoRow icon={Globe2} label="通信协议" value="HTTP/2" />
            <InfoRow icon={Cpu} label="运行环境" value="Node.js" />
            <InfoRow icon={Monitor} label="系统信息" value="Next Typecho" />
          </div>

          <div className="lite-data-column">
            <h2>访客信息</h2>
            <InfoRow icon={Clock3} label="持续运行" value={uptime} />
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

"use client";

import {
  Activity,
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
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
} from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import Heatmap from "@/components/8starlabs-ui/heatmap";
import { TabsSubtle, TabsSubtleItem } from "@/components/ui/tabs-subtle";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type RuntimeStats = {
  cpu: number;
  cpuCores: number;
  memory: number;
  disk: number;
  cache: number;
  load: {
    one: number;
    five: number;
    fifteen: number;
  };
  memoryDetail: string;
  articleCacheDetail: string;
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

type TrafficDay = {
  date: string;
  pageViews: number;
  visitors: number;
};

type TrafficSummary = {
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

const trafficChartConfig = {
  pageViews: {
    label: "页面浏览",
    color: "#5e75df",
  },
  visitors: {
    label: "独立访客",
    color: "#42a777",
  },
} satisfies ChartConfig;

const initialStats: RuntimeStats = {
  cpu: 0,
  cpuCores: 0,
  memory: 0,
  disk: 0,
  cache: 0,
  load: { one: 0, five: 0, fifteen: 0 },
  memoryDetail: "读取中",
  articleCacheDetail: "读取中",
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

function OverflowTooltip({
  value,
  variant,
}: {
  value: string;
  variant: "small" | "strong";
}) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useLayoutEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const measure = () => setOverflow(element.scrollWidth > element.clientWidth);
    measure();

    if (typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    return () => observer.disconnect();
  }, [value]);

  const element = variant === "small" ? (
    <small ref={(node) => { elementRef.current = node; }}>{value}</small>
  ) : (
    <strong ref={(node) => { elementRef.current = node; }}>{value}</strong>
  );

  return (
    <Tooltip>
      <TooltipTrigger render={element}>{value}</TooltipTrigger>
      {overflow ? (
        <TooltipContent
          sideOffset={10}
          className="lite-reversed-tooltip bg-background text-foreground"
          arrowClassName="!bg-background !fill-background"
        >
          {value}
        </TooltipContent>
      ) : null}
    </Tooltip>
  );
}

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
          {detail ? <OverflowTooltip value={detail} variant="small" /> : null}
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
      <OverflowTooltip value={value} variant="strong" />
    </div>
  );
}

function LoadAverageRow({
  value,
  current,
}: {
  value: RuntimeStats["load"];
  current: number;
}) {
  return (
    <div className="lite-data-metric lite-load-metric">
      <div className="lite-data-row">
        <span className="lite-data-label">
          <Gauge aria-hidden="true" />
          <span>系统负载</span>
          <strong className="lite-load-values" aria-label="1 分钟、5 分钟、15 分钟平均负载">
            <span title="1 分钟平均负载">{value.one.toFixed(2)}</span>
            <span title="5 分钟平均负载">{value.five.toFixed(2)}</span>
            <span title="15 分钟平均负载">{value.fifteen.toFixed(2)}</span>
          </strong>
        </span>
        <strong className="lite-load-current">{current.toFixed(1)}%</strong>
      </div>
      <span className="lite-data-progress" aria-hidden="true">
        <span style={{ width: `${Math.max(1, Math.min(current, 100))}%` }} />
      </span>
    </div>
  );
}

function detectBrowser(userAgent: string) {
  const matchVersion = (pattern: RegExp) => userAgent.match(pattern)?.[1] ?? "未知版本";

  if (userAgent.includes("Edg/")) return `Edge ${matchVersion(/Edg\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("OPR/")) return `Opera ${matchVersion(/OPR\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("CriOS/")) return `Chrome ${matchVersion(/CriOS\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("FxiOS/")) return `Firefox ${matchVersion(/FxiOS\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("Chrome/")) return `Chrome ${matchVersion(/Chrome\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("Firefox/")) return `Firefox ${matchVersion(/Firefox\/(\d+(?:\.\d+)?)/)}`;
  if (userAgent.includes("Safari/")) return `Safari ${matchVersion(/Version\/(\d+(?:\.\d+)?)/)}`;
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

function TrafficHeatmap({ days }: { days: TrafficDay[] }) {
  const firstDay = days[0]?.date ?? new Date().toISOString().slice(0, 10);
  const lastDay = days.at(-1)?.date ?? firstDay;

  return (
    <div className="lite-traffic-chart lite-traffic-heatmap-card">
      <div className="lite-traffic-chart-heading">
        <strong>近 120 天访问热力</strong>
        <span>近 {days.length} 天</span>
      </div>
      <div className="lite-traffic-heatmap-scroll">
        <Heatmap
          className="lite-traffic-heatmap"
          colorMode="discrete"
          colorScale={["#eceeed", "#d9eddf", "#9fd5ad", "#55b879", "#248a51"]}
          data={days.map((day) => ({
            date: day.date,
            value: day.pageViews,
          }))}
          startDate={new Date(`${firstDay}T00:00:00`)}
          endDate={new Date(`${lastDay}T00:00:00`)}
          cellSize={16}
          gap={4}
          daysOfTheWeek="MWF"
          displayStyle="squares"
          dateDisplayFunction={(date) =>
            date.toLocaleDateString("zh-CN", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })
          }
          valueDisplayFunction={(value) => `${value} 次页面浏览`}
        />
      </div>
      <div className="lite-traffic-legend" aria-hidden="true">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i className={`is-level-${level}`} key={level} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}

function TrafficTrend({ days }: { days: TrafficDay[] }) {
  const recentDays = days.slice(-30).map((day) => ({
    ...day,
    label: day.date.slice(5).replace("-", "/"),
  }));

  return (
    <div className="lite-traffic-chart lite-traffic-trend-card">
      <div className="lite-traffic-chart-heading">
        <strong>访问趋势</strong>
        <span>近 30 天 PV / UV</span>
      </div>
      <ChartContainer
        config={trafficChartConfig}
        className="lite-traffic-trend"
      >
        <AreaChart
          accessibilityLayer
          data={recentDays}
          margin={{ top: 6, right: 8, left: 2, bottom: 0 }}
        >
          <defs>
            <linearGradient id="trafficPageViews" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-pageViews)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="var(--color-pageViews)" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="trafficVisitors" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="var(--color-visitors)" stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--color-visitors)" stopOpacity={0.01} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} />
          <XAxis
            axisLine={false}
            dataKey="label"
            interval={5}
            tickLine={false}
            tickMargin={8}
          />
          <YAxis
            allowDecimals={false}
            axisLine={false}
            tickLine={false}
            width={42}
          />
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                className="lite-traffic-tooltip"
                indicator="line"
                labelFormatter={(_, payload) =>
                  String(payload[0]?.payload?.date ?? "")
                }
              />
            }
          />
          <Area
            dataKey="pageViews"
            fill="url(#trafficPageViews)"
            stroke="var(--color-pageViews)"
            strokeWidth={2}
            type="monotone"
          />
          <Area
            dataKey="visitors"
            fill="url(#trafficVisitors)"
            stroke="var(--color-visitors)"
            strokeWidth={2}
            type="monotone"
          />
        </AreaChart>
      </ChartContainer>
    </div>
  );
}

function TrafficDashboard({ summary }: { summary: TrafficSummary | null }) {
  const totals = summary?.totals;
  return (
    <section className="lite-traffic-dashboard" aria-label="网站流量统计">
      <div className="lite-traffic-header">
        <div>
          <h2>访问统计</h2>
          <p>异步采集，15 秒批量写入，不阻塞页面访问</p>
        </div>
        <TooltipProvider>
          <div className="lite-traffic-totals">
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <strong>{totals?.todayPageViews ?? 0}</strong>今日 PV
              </TooltipTrigger>
              <TooltipContent>PV：页面浏览量</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <strong>{totals?.todayVisitors ?? 0}</strong>今日 UV
              </TooltipTrigger>
              <TooltipContent>UV：独立访客数</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <strong>{totals?.pageViews ?? 0}</strong>120 天 PV
              </TooltipTrigger>
              <TooltipContent>PV：页面浏览量</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger render={<span />}>
                <strong>{totals?.visitors ?? 0}</strong>120 天 UV
              </TooltipTrigger>
              <TooltipContent>UV：独立访客数</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      {summary ? (
        <div className="lite-traffic-charts">
          <TrafficHeatmap days={summary.days} />
          <TrafficTrend days={summary.days} />
        </div>
      ) : (
        <div className="lite-traffic-loading">正在读取访问统计…</div>
      )}
    </section>
  );
}

export function SystemDataPanel({ canViewTraffic }: { canViewTraffic: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [activePanel, setActivePanel] = useState<"system" | "traffic" | null>(null);
  const [now, setNow] = useState("--");
  const [stats, setStats] = useState<RuntimeStats>(initialStats);
  const [visitor, setVisitor] = useState<VisitorData>(initialVisitor);
  const [traffic, setTraffic] = useState<TrafficSummary | null>(null);
  const open = activePanel !== null;

  useEffect(() => {
    if (!open) return;

    const closeOnScroll = () => setActivePanel(null);

    window.addEventListener("wheel", closeOnScroll, { passive: true });
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    window.addEventListener("touchmove", closeOnScroll, { passive: true });
    return () => {
      window.removeEventListener("wheel", closeOnScroll);
      window.removeEventListener("scroll", closeOnScroll);
      window.removeEventListener("touchmove", closeOnScroll);
    };
  }, [open]);

  useEffect(() => {
    const userAgent = window.navigator.userAgent;
    const browserCores = window.navigator.hardwareConcurrency ?? 0;
    const connection = (
      window.navigator as Navigator & {
        connection?: { effectiveType?: string };
      }
    ).connection;

    setStats((current) => ({
      ...current,
      cpuCores: browserCores > 0 ? browserCores : current.cpuCores,
    }));

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
    if (activePanel !== "system") return;

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
          cpuCores: number;
          memory: { used: number; total: number; percent: number };
          articleCache: { count: number; bytes: number; builtAt: number };
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
          load: {
            one: number;
            five: number;
            fifteen: number;
          };
          uptime: number;
          platform: string;
          runtime: string;
          serverTime: string;
        };

        setStats({
          cpu: data.cpu,
          cpuCores: typeof data.cpuCores === "number" ? data.cpuCores : 0,
          memory: data.memory.percent,
          disk: data.disk.percent,
          cache: data.processMemory.percent,
          load: data.load,
          memoryDetail: `${formatBytes(data.memory.used)} / ${formatBytes(data.memory.total)}`,
          articleCacheDetail: `${data.articleCache?.count ?? 0} 篇 · ${formatBytes(data.articleCache?.bytes ?? 0)}`,
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
          articleCacheDetail: "读取失败",
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
  }, [activePanel]);

  useEffect(() => {
    if (activePanel !== "traffic" || !canViewTraffic) return;

    const updateTraffic = async () => {
      try {
        const response = await fetch("/api/analytics/summary?days=120", {
          cache: "no-store",
        });
        if (response.ok) setTraffic((await response.json()) as TrafficSummary);
      } catch {
        // 流量统计读取失败不影响系统状态面板。
      }
    };

    void updateTraffic();
    const timer = window.setInterval(() => {
      void updateTraffic();
    }, 60_000);
    return () => window.clearInterval(timer);
  }, [activePanel, canViewTraffic]);

  useEffect(() => {
    if (!open) return;

    const closeOnOutsideClick = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setActivePanel(null);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActivePanel(null);
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
      <TabsSubtle
        className="lite-system-data-tabs"
        selectedIndex={
          activePanel === "system" ? 0 : activePanel === "traffic" && canViewTraffic ? 1 : -1
        }
        onSelect={() => undefined}
        activeLabel
        aria-label="站点数据菜单"
      >
        <TabsSubtleItem
          className={activePanel === "system" ? "lite-system-data-tab is-open" : "lite-system-data-tab"}
          icon={Activity}
          label="仪表盘"
          index={0}
          aria-label="仪表盘"
          aria-haspopup="dialog"
          aria-expanded={activePanel === "system"}
          onClick={() =>
            setActivePanel((current) => current === "system" ? null : "system")
          }
        />
        {canViewTraffic ? (
          <TabsSubtleItem
            className={activePanel === "traffic" ? "lite-system-data-tab is-open" : "lite-system-data-tab"}
            icon={Globe2}
            label="访问统计"
            index={1}
            aria-label="访问统计"
            aria-haspopup="dialog"
            aria-expanded={activePanel === "traffic"}
            onClick={() =>
              setActivePanel((current) => current === "traffic" ? null : "traffic")
            }
          />
        ) : null}
      </TabsSubtle>

      <AnimatePresence mode="wait">
      {activePanel === "system" ? (
        <motion.section
          key="system-panel"
          className="lite-system-data-panel"
          role="dialog"
          aria-label="站点运行数据"
          initial={{ x: "-50%", y: -6, opacity: 0 }}
          animate={{ x: "-50%", y: 0, opacity: 1 }}
          exit={{ x: "-50%", y: -12, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <TooltipProvider>
          <div className="lite-data-column">
            <h2>运行状态</h2>
            <MetricRow
              icon={Cpu}
              label="CPU 占用"
              detail={stats.cpuCores > 0 ? `${stats.cpuCores}核心` : "读取中"}
              value={stats.cpu}
            />
            <MetricRow icon={MemoryStick} label="占用内存" detail={stats.memoryDetail} value={stats.memory} />
            <MetricRow icon={HardDrive} label="磁盘占用" detail={stats.diskDetail} value={stats.disk} tone="yellow" />
            <MetricRow icon={Database} label="Node 堆内存" detail={stats.cacheDetail} value={stats.cache} />
            <LoadAverageRow value={stats.load} current={stats.cpu} />
            <InfoRow icon={Database} label="文章缓存" value={stats.articleCacheDetail} />
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

          </TooltipProvider>
        </motion.section>
      ) : null}

      {activePanel === "traffic" && canViewTraffic ? (
        <motion.section
          key="traffic-panel"
          className="lite-system-data-panel lite-traffic-data-panel"
          role="dialog"
          aria-label="网站流量统计"
          initial={{ x: "-50%", y: -6, opacity: 0 }}
          animate={{ x: "-50%", y: 0, opacity: 1 }}
          exit={{ x: "-50%", y: -12, opacity: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        >
          <TrafficDashboard summary={traffic} />
        </motion.section>
      ) : null}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
import StatusIndicator from "@/components/8starlabs-ui/status-indicator";

const chartValues = [4, 3, 7, 15, 7, 3, 4, 3, 2, 5, 3, 15, 10, 4, 8, 15];
const highlightedBars = new Set([2, 7, 11, 14]);

export function RealtimeQpsWidget() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const activeValue = activeIndex === null ? 0 : chartValues[activeIndex] ?? 0;
  const activeLeft = activeIndex === null ? "0%" : `${((activeIndex + 0.5) / chartValues.length) * 100}%`;
  const activeTop = `${Math.max(18, 100 - (activeValue / 15) * 100 - 7)}%`;

  return (
    <section className="handsome-qps-widget" aria-label="实时访客">
      <div className="handsome-qps-card">
        <div className="handsome-qps-header">
          <h2>Realtime Visitors</h2>
          <MoreHorizontal aria-hidden="true" />
        </div>
        <div className="handsome-qps-metric">
          <span><strong>24</strong><em>per minute</em></span>
          <StatusIndicator
            state="active"
            size="sm"
            label="Live"
            className="handsome-qps-live"
          />
        </div>
        <div className="handsome-qps-chart-wrap" aria-hidden="true">
          <div className="handsome-qps-chart" onMouseLeave={() => setActiveIndex(null)}>
            {chartValues.map((value, index) => (
              <i
                className={highlightedBars.has(index) ? "is-highlighted" : undefined}
                key={`${value}-${index}`}
                title={`${value} QPS`}
                style={{ height: `${(value / 15) * 100}%` }}
                tabIndex={0}
                role="button"
                aria-label={`${value} Visitors`}
                onMouseEnter={() => setActiveIndex(index)}
                onFocus={() => setActiveIndex(index)}
              />
            ))}
            {activeIndex !== null && (
              <div className="handsome-qps-tooltip" style={{ left: activeLeft, top: activeTop }}>
                <span />
                <em>Visitors</em>
                <strong>{activeValue}</strong>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

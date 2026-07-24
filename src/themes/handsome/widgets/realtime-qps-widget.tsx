import { Activity, RefreshCw } from "lucide-react";

const chartValues = [54, 42, 25, 24, 82, 25, 25, 34, 25, 25, 57, 25, 50, 42, 42];

export function RealtimeQpsWidget() {
  return (
    <section className="handsome-qps-widget" aria-label="实时 QPS">
      <h2>实时QPS</h2>
      <div className="handsome-qps-card">
        <div className="handsome-qps-summary">
          <span>
            <Activity aria-hidden="true" />
            <strong>5</strong>
          </span>
          <RefreshCw aria-hidden="true" />
        </div>
        <div className="handsome-qps-chart" aria-hidden="true">
          {chartValues.map((value, index) => (
            <i key={`${value}-${index}`} style={{ height: `${value}%` }} />
          ))}
        </div>
      </div>
    </section>
  );
}

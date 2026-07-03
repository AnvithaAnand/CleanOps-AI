import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ReferenceDot, ResponsiveContainer,
} from "recharts";
import { useTrustHistory } from "../../hooks/useDatasets";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

function formatDate(iso) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function getScoreColor(score) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#22d3ee";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-xl px-3 py-2.5 text-xs shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
      <p className="font-bold mb-1" style={{ color: getScoreColor(d.score) }}>{d.score}/100</p>
      <p style={{ color: "var(--text-muted)" }}>{formatDate(d.recorded_at)}</p>
      <p className="mt-0.5 capitalize" style={{ color: "var(--text-faint)" }}>{d.event_type}</p>
    </div>
  );
}

export default function TrustHistoryChart({ datasetId }) {
  const { data: history, isLoading } = useTrustHistory(datasetId);

  if (isLoading) return <div className="h-36 shimmer rounded-xl" />;

  if (!history || history.length === 0) {
    return (
      <div className="h-36 flex items-center justify-center rounded-xl"
        style={{ background: "var(--bg-hover)", border: "1px dashed var(--border)" }}>
        <p className="text-xs" style={{ color: "var(--text-faint)" }}>
          Score history will appear after the next profile run
        </p>
      </div>
    );
  }

  const latest = history[history.length - 1]?.score ?? 0;
  const first = history[0]?.score ?? 0;
  const delta = Math.round(latest - first);
  const gradId = `trustGrad-${datasetId}`;
  const lineColor = getScoreColor(latest);

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Score History</p>
        {history.length > 1 && (
          <div className="flex items-center gap-1 text-xs font-medium">
            {delta > 0
              ? <><TrendingUp style={{ width: 12, height: 12, color: "var(--success)" }} /><span style={{ color: "var(--success)" }}>+{delta}</span></>
              : delta < 0
              ? <><TrendingDown style={{ width: 12, height: 12, color: "var(--danger)" }} /><span style={{ color: "var(--danger)" }}>{delta}</span></>
              : <><Minus style={{ width: 12, height: 12, color: "var(--text-faint)" }} /><span style={{ color: "var(--text-faint)" }}>No change</span></>
            }
            <span style={{ color: "var(--text-faint)" }}>since upload</span>
          </div>
        )}
      </div>

      {/* Chart */}
      <ResponsiveContainer width="100%" height={120}>
        <AreaChart data={history} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.25} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="recorded_at"
            tickFormatter={formatDate}
            tick={{ fontSize: 10, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fontSize: 10, fill: "var(--text-faint)" }}
            axisLine={false}
            tickLine={false}
            ticks={[0, 25, 50, 75, 100]}
          />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="score"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 4, strokeWidth: 0, fill: lineColor }}
          />
          {/* Mark repair events */}
          {history
            .filter((d) => d.event_type === "repaired")
            .map((d, i) => (
              <ReferenceDot
                key={i}
                x={d.recorded_at}
                y={d.score}
                r={4}
                fill="#8b5cf6"
                stroke="var(--bg-card)"
                strokeWidth={2}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-4 text-[10px]" style={{ color: "var(--text-faint)" }}>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-0.5 rounded" style={{ background: lineColor }} />
          <span>Trust score</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6" }} />
          <span>Repair applied</span>
        </div>
      </div>
    </div>
  );
}

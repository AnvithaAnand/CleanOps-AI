import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";
import { useWorkspaceAnalytics } from "../../hooks/useDatasets";

const TIER_COLORS = {
  Excellent: "#34d399",
  Good:      "#22d3ee",
  Fair:      "#fbbf24",
  Poor:      "#fb923c",
  Critical:  "#f87171",
};

const ISSUE_COLOR = "#818cf8";

function PieTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { tier, count } = payload[0].payload;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
      <span style={{ color: TIER_COLORS[tier] ?? "var(--text-primary)" }}>{tier}</span>
      <span className="ml-2 font-semibold" style={{ color: "var(--text-primary)" }}>{count}</span>
    </div>
  );
}

function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl px-3 py-2 text-xs shadow-xl"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-semibold mt-0.5" style={{ color: "var(--text-primary)" }}>{payload[0].value} open</p>
    </div>
  );
}

export default function WorkspaceAnalytics() {
  const { data, isLoading } = useWorkspaceAnalytics();

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="h-44 shimmer rounded-xl" />
        <div className="h-44 shimmer rounded-xl" />
      </div>
    );
  }

  const hasScores = data?.score_distribution?.length > 0;
  const hasIssues = data?.issues_by_type?.length > 0;

  if (!hasScores && !hasIssues) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

      {/* Trust score distribution */}
      <div className="glow-card p-5">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Score Distribution</p>
        {hasScores ? (
          <div className="flex items-center gap-4">
            <ResponsiveContainer width={110} height={110}>
              <PieChart>
                <Pie data={data.score_distribution} dataKey="count" nameKey="tier"
                  cx="50%" cy="50%" innerRadius={30} outerRadius={50} strokeWidth={0}>
                  {data.score_distribution.map((entry) => (
                    <Cell key={entry.tier} fill={TIER_COLORS[entry.tier] ?? "#6366f1"} />
                  ))}
                </Pie>
                <Tooltip content={<PieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 space-y-1.5">
              {data.score_distribution.map(({ tier, count }) => (
                <div key={tier} className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TIER_COLORS[tier] }} />
                    <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>{tier}</span>
                  </div>
                  <span className="text-[11px] font-semibold" style={{ color: "var(--text-primary)" }}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs py-6 text-center" style={{ color: "var(--text-faint)" }}>No scored datasets yet</p>
        )}
      </div>

      {/* Issues by type */}
      <div className="glow-card p-5">
        <p className="text-xs font-semibold mb-3" style={{ color: "var(--text-primary)" }}>Open Issues by Type</p>
        {hasIssues ? (
          <ResponsiveContainer width="100%" height={110}>
            <BarChart data={data.issues_by_type} margin={{ top: 0, right: 0, bottom: 0, left: -28 }}
              barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="type" tick={{ fontSize: 9, fill: "var(--text-faint)" }}
                axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 9, fill: "var(--text-faint)" }}
                axisLine={false} tickLine={false} />
              <Tooltip content={<BarTooltip />} cursor={{ fill: "var(--bg-hover)" }} />
              <Bar dataKey="count" fill={ISSUE_COLOR} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-xs py-6 text-center" style={{ color: "var(--text-faint)" }}>No open issues</p>
        )}
      </div>

    </div>
  );
}

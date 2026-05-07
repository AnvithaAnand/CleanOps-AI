import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-2.5 py-2 rounded-lg"
      style={{ background: "var(--bg-card)", border: `1px solid var(--border-strong)`, color: "var(--text-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="font-semibold" style={{ color: "var(--accent-light)" }}>{payload[0].value} rows</p>
    </div>
  );
};

export default function DistributionChart({ data, type = "numeric" }) {
  if (!data || data.length === 0) {
    return <div className="h-24 flex items-center justify-center text-xs" style={{ color: "var(--text-faint)" }}>No distribution data</div>;
  }

  const chartData = type === "numeric"
    ? data.map((d) => ({ name: `${d.bin_start?.toFixed(0)}–${d.bin_end?.toFixed(0)}`, count: d.count }))
    : data.map((d) => ({ name: String(d.value).slice(0, 10), count: d.count }));

  return (
    <ResponsiveContainer width="100%" height={90}>
      <BarChart data={chartData.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis dataKey="name" tick={{ fontSize: 9, fill: "var(--text-faint)" }} interval={0} axisLine={false} tickLine={false} />
        <YAxis tick={{ fontSize: 9, fill: "var(--text-faint)" }} width={28} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--accent-bg)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {chartData.slice(0, 10).map((_, i) => (
            <Cell key={i} fill={`rgba(99,102,241,${0.35 + (i / 10) * 0.55})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      className="text-xs px-2.5 py-2 rounded-lg"
      style={{ background: "#1e293b", border: "1px solid #334155", color: "#e2e8f0" }}
    >
      <p style={{ color: "#94a3b8" }}>{label}</p>
      <p className="font-semibold" style={{ color: "#a5b4fc" }}>{payload[0].value} rows</p>
    </div>
  );
};

export default function DistributionChart({ data, type = "numeric" }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-24 flex items-center justify-center text-xs" style={{ color: "#475569" }}>
        No distribution data
      </div>
    );
  }

  const chartData = type === "numeric"
    ? data.map((d) => ({ name: `${d.bin_start?.toFixed(0)}–${d.bin_end?.toFixed(0)}`, count: d.count }))
    : data.map((d) => ({ name: String(d.value).slice(0, 10), count: d.count }));

  return (
    <ResponsiveContainer width="100%" height={100}>
      <BarChart data={chartData.slice(0, 10)} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
        <XAxis
          dataKey="name"
          tick={{ fontSize: 9, fill: "#475569" }}
          interval={0}
          angle={type === "numeric" ? -20 : 0}
          axisLine={false}
          tickLine={false}
        />
        <YAxis tick={{ fontSize: 9, fill: "#475569" }} width={28} axisLine={false} tickLine={false} />
        <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(99,102,241,0.05)" }} />
        <Bar dataKey="count" radius={[3, 3, 0, 0]}>
          {chartData.slice(0, 10).map((_, i) => (
            <Cell key={i} fill={`rgba(99,102,241,${0.4 + (i / 10) * 0.5})`} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

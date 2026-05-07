import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function DistributionChart({ data, type = "numeric" }) {
  if (!data || data.length === 0) {
    return (
      <div className="h-32 flex items-center justify-center text-sm text-muted-foreground">
        No distribution data
      </div>
    );
  }

  const chartData =
    type === "numeric"
      ? data.map((d) => ({
          name: `${d.bin_start?.toFixed(0)}–${d.bin_end?.toFixed(0)}`,
          count: d.count,
        }))
      : data.map((d) => ({
          name: String(d.value).slice(0, 12),
          count: d.count,
        }));

  return (
    <ResponsiveContainer width="100%" height={120}>
      <BarChart data={chartData.slice(0, 10)}>
        <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} angle={-20} />
        <YAxis tick={{ fontSize: 10 }} width={30} />
        <Tooltip />
        <Bar dataKey="count" fill="#2563eb" radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

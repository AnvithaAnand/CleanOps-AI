import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#ef4444", "#f59e0b", "#6366f1", "#8b5cf6", "#10b981", "#06b6d4"];

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs px-2.5 py-2 rounded-lg"
      style={{ background: "var(--bg-card)", border: `1px solid var(--border-strong)`, color: "var(--text-primary)" }}>
      <p style={{ color: "var(--text-muted)" }}>{payload[0].name}</p>
      <p className="font-semibold" style={{ color: payload[0].payload.color }}>
        {payload[0].value} issue{payload[0].value !== 1 ? "s" : ""}
      </p>
    </div>
  );
};

export default function IssueBreakdownChart({ issues }) {
  if (!issues || issues.length === 0) return null;

  const typeMap = {};
  issues.forEach((issue) => {
    const type = issue.issue_type.replace("rule_violation:", "rule: ");
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  const data = Object.entries(typeMap).map(([name, value], i) => ({
    name, value, color: COLORS[i % COLORS.length],
  }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={110} height={110}>
        <PieChart>
          <Pie data={data} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" stroke="none">
            {data.map((_, idx) => <Cell key={idx} fill={COLORS[idx % COLORS.length]} />)}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex-1 space-y-1.5">
        {data.map(({ name, value, color }) => (
          <div key={name} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
              <span className="text-xs truncate" style={{ color: "var(--text-secondary)", maxWidth: 150 }}>{name}</span>
            </div>
            <span className="text-xs font-semibold flex-shrink-0" style={{ color }}>{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

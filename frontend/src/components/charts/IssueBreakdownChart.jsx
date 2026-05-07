import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["#ef4444", "#f59e0b", "#3b82f6", "#8b5cf6", "#22c55e", "#06b6d4"];

export default function IssueBreakdownChart({ issues }) {
  if (!issues || issues.length === 0) return null;

  const typeMap = {};
  issues.forEach((issue) => {
    const type = issue.issue_type.replace("rule_violation:", "rule: ");
    typeMap[type] = (typeMap[type] || 0) + 1;
  });

  const data = Object.entries(typeMap).map(([name, value]) => ({ name, value }));

  return (
    <ResponsiveContainer width="100%" height={200}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          outerRadius={70}
          dataKey="value"
          label={({ name, value }) => `${name} (${value})`}
          labelLine={false}
        >
          {data.map((_, idx) => (
            <Cell key={idx} fill={COLORS[idx % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

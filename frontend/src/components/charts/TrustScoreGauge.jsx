import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

function getColor(score) {
  if (score >= 90) return "#10b981";
  if (score >= 75) return "#22d3ee";
  if (score >= 60) return "#f59e0b";
  if (score >= 40) return "#f97316";
  return "#ef4444";
}

function getLabel(score) {
  if (score >= 90) return "Excellent";
  if (score >= 75) return "Good";
  if (score >= 60) return "Fair";
  if (score >= 40) return "Poor";
  return "Critical";
}

export default function TrustScoreGauge({ score = 0, size = 180 }) {
  const rounded = Math.round(score);
  const color = getColor(rounded);
  const label = getLabel(rounded);

  const data = [
    { value: rounded },
    { value: 100 - rounded },
  ];

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size }}>
        <ResponsiveContainer>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              startAngle={90}
              endAngle={-270}
              innerRadius="68%"
              outerRadius="88%"
              dataKey="value"
              stroke="none"
            >
              <Cell fill={color} />
              <Cell fill="#1e293b" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-bold leading-none" style={{ color }}>
            {rounded}
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider mt-1" style={{ color: "#64748b" }}>
            Trust Score
          </span>
        </div>
      </div>
      <span
        className="text-xs font-semibold px-3 py-1 rounded-full mt-2"
        style={{ background: `${color}18`, color }}
      >
        {label}
      </span>
    </div>
  );
}

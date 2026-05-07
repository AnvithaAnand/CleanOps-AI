import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";

const COLORS = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

export default function TrustScoreGauge({ score, size = 180 }) {
  const color =
    score >= 80 ? COLORS.high : score >= 50 ? COLORS.medium : COLORS.low;

  const data = [
    { value: score },
    { value: 100 - score },
  ];

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            startAngle={90}
            endAngle={-270}
            innerRadius="70%"
            outerRadius="90%"
            dataKey="value"
            stroke="none"
          >
            <Cell fill={color} />
            <Cell fill="#e4e4e7" />
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold" style={{ color }}>
          {Math.round(score)}
        </span>
        <span className="text-xs text-muted-foreground">Trust Score</span>
      </div>
    </div>
  );
}

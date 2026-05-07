import { Link } from "react-router-dom";
import { Upload, Database, AlertTriangle, CheckCircle, TrendingUp, Sparkles } from "lucide-react";
import { useDatasets } from "../hooks/useDatasets";
import DatasetCard from "../components/dashboard/DatasetCard";

function SkeletonCard() {
  return (
    <div className="rounded-xl p-5 shimmer" style={{ height: 148, background: "#111827" }} />
  );
}

export default function Dashboard() {
  const { data: datasets, isLoading } = useDatasets();

  const total = datasets?.length || 0;
  const validated = datasets?.filter((d) => d.status === "validated").length || 0;
  const withIssues = datasets?.filter((d) => d.trust_score != null && d.trust_score < 80).length || 0;
  const healthy = datasets?.filter((d) => d.trust_score != null && d.trust_score >= 80).length || 0;
  const avgScore = total > 0 && datasets?.some((d) => d.trust_score != null)
    ? Math.round(
        datasets.filter((d) => d.trust_score != null).reduce((s, d) => s + d.trust_score, 0) /
          datasets.filter((d) => d.trust_score != null).length
      )
    : null;

  const stats = [
    {
      label: "Total Datasets",
      value: total,
      icon: Database,
      color: "#6366f1",
      gradient: "linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.08))",
      border: "rgba(99,102,241,0.2)",
    },
    {
      label: "Validated",
      value: validated,
      icon: CheckCircle,
      color: "#10b981",
      gradient: "linear-gradient(135deg, rgba(16,185,129,0.12), rgba(16,185,129,0.05))",
      border: "rgba(16,185,129,0.2)",
    },
    {
      label: "Needs Attention",
      value: withIssues,
      icon: AlertTriangle,
      color: "#f59e0b",
      gradient: "linear-gradient(135deg, rgba(245,158,11,0.12), rgba(245,158,11,0.05))",
      border: "rgba(245,158,11,0.2)",
    },
    {
      label: "Avg Trust Score",
      value: avgScore != null ? `${avgScore}/100` : "—",
      icon: TrendingUp,
      color: "#06b6d4",
      gradient: "linear-gradient(135deg, rgba(6,182,212,0.12), rgba(6,182,212,0.05))",
      border: "rgba(6,182,212,0.2)",
    },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>
          Monitor and manage your data quality at a glance
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, gradient, border }) => (
          <div
            key={label}
            className="rounded-xl p-5"
            style={{ background: gradient, border: `1px solid ${border}` }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#64748b" }}>
                {label}
              </span>
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: `${color}20` }}
              >
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p className="text-3xl font-bold text-white">{isLoading ? "—" : value}</p>
          </div>
        ))}
      </div>

      {/* Datasets */}
      {isLoading ? (
        <div>
          <div className="h-5 shimmer rounded w-32 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
          </div>
        </div>
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-white">Your Datasets</h3>
              <span
                className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "rgba(99,102,241,0.12)", color: "#a5b4fc" }}
              >
                {total}
              </span>
            </div>
            <Link
              to="/upload"
              className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: "#6366f1" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#a5b4fc"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#6366f1"; }}
            >
              <Upload style={{ width: 12, height: 12 }} />
              Upload New
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {datasets.map((ds) => (
              <DatasetCard key={ds.id} dataset={ds} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div
      className="rounded-2xl p-12 text-center"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))",
        border: "1px solid rgba(99,102,241,0.12)",
      }}
    >
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
      >
        <Database style={{ width: 28, height: 28, color: "#6366f1" }} />
      </div>
      <h3 className="text-lg font-bold text-white mb-2">No datasets yet</h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "#64748b" }}>
        Upload your first dataset to start profiling data quality and detecting issues automatically.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/upload"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 4px 20px rgba(99,102,241,0.35)",
          }}
        >
          <Upload style={{ width: 15, height: 15 }} />
          Upload Dataset
        </Link>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "#475569" }}>
          <Sparkles style={{ width: 12, height: 12, color: "#6366f1" }} />
          Supports CSV, XLSX, Parquet
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Database, AlertTriangle, CheckCircle, TrendingUp, Sparkles, Search } from "lucide-react";
import { useDatasets } from "../hooks/useDatasets";
import DatasetCard from "../components/dashboard/DatasetCard";

export default function Dashboard() {
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState(null);

  const { data: allDatasets, isLoading } = useDatasets();
  const { data: filtered, isLoading: isFiltering } = useDatasets(
    search || activeTag ? { search: search || undefined, tag: activeTag || undefined } : undefined
  );

  const datasets = (search || activeTag) ? filtered : allDatasets;
  const loading = isLoading || isFiltering;

  const total     = allDatasets?.length || 0;
  const validated = allDatasets?.filter((d) => d.status === "validated").length || 0;
  const withIssues = allDatasets?.filter((d) => d.trust_score != null && d.trust_score < 80).length || 0;
  const scored    = allDatasets?.filter((d) => d.trust_score != null) || [];
  const avgScore  = scored.length
    ? Math.round(scored.reduce((s, d) => s + d.trust_score, 0) / scored.length)
    : null;

  // Collect all tags across datasets for tag filter pills
  const allTags = [...new Set(
    (allDatasets || []).flatMap((d) => {
      try { return JSON.parse(d.tags || "[]"); } catch { return []; }
    })
  )];

  const stats = [
    { label: "Total Datasets",  value: total,                      icon: Database,       color: "#6366f1", grad: "rgba(99,102,241,0.1)",  border: "rgba(99,102,241,0.2)" },
    { label: "Validated",       value: validated,                   icon: CheckCircle,    color: "#10b981", grad: "rgba(16,185,129,0.08)", border: "rgba(16,185,129,0.18)" },
    { label: "Needs Attention", value: withIssues,                  icon: AlertTriangle,  color: "#f59e0b", grad: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.18)" },
    { label: "Avg Trust Score", value: avgScore != null ? `${avgScore}/100` : "—", icon: TrendingUp, color: "#06b6d4", grad: "rgba(6,182,212,0.08)", border: "rgba(6,182,212,0.18)" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Monitor and manage your data quality at a glance
        </p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ label, value, icon: Icon, color, grad, border }) => (
          <div key={label} className="rounded-xl p-5" style={{ background: grad, border: `1px solid ${border}` }}>
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${color}22` }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p className="text-3xl font-bold" style={{ color: "var(--text-primary)" }}>
              {isLoading ? "—" : value}
            </p>
          </div>
        ))}
      </div>

      {/* Search + tag filters */}
      {total > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search style={{ width: 14, height: 14, position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              type="text"
              placeholder="Search datasets by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm rounded-xl outline-none"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="text-xs px-2.5 py-1 rounded-full font-medium transition-all"
                  style={{
                    background: activeTag === tag ? "var(--accent-bg)" : "var(--bg-hover)",
                    color: activeTag === tag ? "var(--accent-light)" : "var(--text-muted)",
                    border: `1px solid ${activeTag === tag ? "var(--accent-border)" : "var(--border)"}`,
                  }}
                >
                  #{tag}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Datasets */}
      {loading ? (
        <div>
          <div className="h-4 shimmer rounded w-28 mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map((i) => <div key={i} className="rounded-xl shimmer" style={{ height: 148 }} />)}
          </div>
        </div>
      ) : total === 0 ? (
        <EmptyState />
      ) : (
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                {search || activeTag ? "Results" : "Your Datasets"}
              </h3>
              <span className="text-xs font-medium px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}>
                {datasets?.length || 0}
              </span>
            </div>
            <Link to="/upload" className="flex items-center gap-1.5 text-xs font-medium transition-colors"
              style={{ color: "var(--accent)", textDecoration: "none" }}>
              <Upload style={{ width: 12, height: 12 }} />
              Upload New
            </Link>
          </div>
          {datasets?.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>No datasets match your search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {datasets?.map((ds) => <DatasetCard key={ds.id} dataset={ds} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl p-12 text-center"
      style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}>
      <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}>
        <Database style={{ width: 28, height: 28, color: "var(--accent)" }} />
      </div>
      <h3 className="text-lg font-bold mb-2" style={{ color: "var(--text-primary)" }}>No datasets yet</h3>
      <p className="text-sm mb-6 max-w-xs mx-auto" style={{ color: "var(--text-muted)" }}>
        Upload your first dataset to start profiling data quality and detecting issues automatically.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link to="/upload"
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
          style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: "0 4px 18px rgba(99,102,241,0.3)", textDecoration: "none" }}>
          <Upload style={{ width: 15, height: 15 }} />
          Upload Dataset
        </Link>
        <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
          <Sparkles style={{ width: 12, height: 12, color: "var(--accent)" }} />
          Supports CSV, XLSX, Parquet
        </div>
      </div>
    </div>
  );
}

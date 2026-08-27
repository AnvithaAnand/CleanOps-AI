import { useState } from "react";
import { Link } from "react-router-dom";
import { Upload, Database, AlertTriangle, CheckCircle, TrendingUp, Sparkles, Search, ArrowUpRight } from "lucide-react";
import { useDatasets } from "../hooks/useDatasets";
import DatasetCard from "../components/dashboard/DatasetCard";
import WorkspaceAnalytics from "../components/dashboard/WorkspaceAnalytics";

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

  const allTags = [...new Set(
    (allDatasets || []).flatMap((d) => {
      try { return JSON.parse(d.tags || "[]"); } catch { return []; }
    })
  )];

  const stats = [
    { label: "Total Datasets",  value: total,                      icon: Database,       color: "#818cf8", grad: "linear-gradient(135deg, rgba(129,140,248,0.1), rgba(99,102,241,0.05))" },
    { label: "Validated",       value: validated,                   icon: CheckCircle,    color: "#34d399", grad: "linear-gradient(135deg, rgba(52,211,153,0.08), rgba(16,185,129,0.04))" },
    { label: "Needs Attention", value: withIssues,                  icon: AlertTriangle,  color: "#fbbf24", grad: "linear-gradient(135deg, rgba(251,191,36,0.08), rgba(245,158,11,0.04))" },
    { label: "Avg Trust Score", value: avgScore != null ? `${avgScore}/100` : "—", icon: TrendingUp, color: "#22d3ee", grad: "linear-gradient(135deg, rgba(34,211,238,0.08), rgba(6,182,212,0.04))" },
  ];

  return (
    <div className="space-y-7 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Dashboard</h1>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            Monitor and manage your data quality at a glance
          </p>
        </div>
        {total > 0 && (
          <Link to="/upload" className="btn-primary text-xs">
            <Upload style={{ width: 13, height: 13 }} />
            Upload
          </Link>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 stagger-children">
        {stats.map(({ label, value, icon: Icon, color, grad }) => (
          <div key={label} className="stat-card group" style={{ "--card-accent": color, background: grad }}>
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                {label}
              </span>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center transition-transform duration-200 group-hover:scale-110"
                style={{ background: `${color}18`, border: `1px solid ${color}25` }}>
                <Icon style={{ width: 14, height: 14, color }} />
              </div>
            </div>
            <p className="text-[2rem] font-extrabold tracking-tight" style={{ color: "var(--text-primary)" }}>
              {isLoading ? <span className="shimmer inline-block w-12 h-7 rounded" /> : value}
            </p>
          </div>
        ))}
      </div>

      {/* Workspace analytics charts */}
      {!isLoading && total > 0 && <WorkspaceAnalytics />}

      {/* Search + tag filters */}
      {total > 0 && (
        <div className="space-y-3">
          <div className="relative">
            <Search style={{ width: 14, height: 14, position: "absolute", left: 14, top: "50%", transform: "translateY(-50%)", color: "var(--text-faint)" }} />
            <input
              type="text"
              placeholder="Search datasets by name…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl outline-none transition-all duration-200"
              style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; e.target.style.boxShadow = "var(--glow-sm)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; e.target.style.boxShadow = "none"; }}
            />
          </div>
          {allTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => setActiveTag(activeTag === tag ? null : tag)}
                  className="text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-200"
                  style={{
                    background: activeTag === tag ? "var(--accent-bg)" : "var(--bg-hover)",
                    color: activeTag === tag ? "var(--accent-light)" : "var(--text-muted)",
                    border: `1px solid ${activeTag === tag ? "var(--accent-border)" : "var(--border)"}`,
                    boxShadow: activeTag === tag ? "var(--glow-sm)" : "none",
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
            {[1,2,3].map((i) => <div key={i} className="rounded-xl shimmer" style={{ height: 180 }} />)}
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
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
                {datasets?.length || 0}
              </span>
            </div>
          </div>
          {datasets?.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: "var(--text-faint)" }}>No datasets match your search.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 stagger-children">
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
    <div className="rounded-2xl p-14 text-center relative overflow-hidden animate-fade-in-up"
      style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(129,140,248,0.06) 0%, transparent 70%)" }} />

      <div className="relative z-10">
        <div className="w-18 h-18 rounded-2xl flex items-center justify-center mx-auto mb-6 animate-float"
          style={{ width: 72, height: 72, background: "linear-gradient(135deg, rgba(129,140,248,0.15), rgba(168,85,247,0.1))", border: "1px solid var(--accent-border)", boxShadow: "var(--glow-md)" }}>
          <Database style={{ width: 30, height: 30, color: "var(--accent)" }} />
        </div>
        <h3 className="text-xl font-bold mb-2" style={{ color: "var(--text-primary)" }}>No datasets yet</h3>
        <p className="text-sm mb-8 max-w-sm mx-auto leading-relaxed" style={{ color: "var(--text-muted)" }}>
          Upload your first dataset to start profiling data quality and detecting issues automatically.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link to="/upload" className="btn-primary px-7 py-3 text-sm" style={{ textDecoration: "none" }}>
            <Upload style={{ width: 15, height: 15 }} />
            Upload Dataset
            <ArrowUpRight style={{ width: 13, height: 13, opacity: 0.7 }} />
          </Link>
          <div className="flex items-center gap-1.5 text-xs" style={{ color: "var(--text-faint)" }}>
            <Sparkles style={{ width: 12, height: 12, color: "var(--accent)" }} />
            Supports CSV, XLSX, Parquet
          </div>
        </div>
      </div>
    </div>
  );
}

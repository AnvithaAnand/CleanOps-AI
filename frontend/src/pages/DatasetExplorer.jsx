import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  Rows3, Columns3, AlertTriangle, Download, Loader2, Shield,
  Eye, BarChart3, Bug, Code2, ArrowUpRight, Sparkles,
} from "lucide-react";
import { useDataset, usePreviewData, useDownloadDataset } from "../hooks/useDatasets";
import { useProfile } from "../hooks/useProfile";
import { useIssues } from "../hooks/useIssues";
import { useTrustScore } from "../hooks/useTrustScore";
import TrustScoreGauge from "../components/charts/TrustScoreGauge";
import DistributionChart from "../components/charts/DistributionChart";
import IssueBreakdownChart from "../components/charts/IssueBreakdownChart";
import AIInsightPanel from "../components/ai/AIInsightPanel";
import CodeExportModal from "../components/ai/CodeExportModal";
import { cn, formatNumber, getSeverityColor } from "../lib/utils";

const tabs = [
  { id: "overview", label: "Overview", icon: Eye },
  { id: "data", label: "Data Preview", icon: Rows3 },
  { id: "columns", label: "Columns", icon: BarChart3 },
  { id: "issues", label: "Issues", icon: Bug },
];

export default function DatasetExplorer() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCode, setShowCode] = useState(false);
  const { data: dataset, isLoading } = useDataset(id);
  const { data: profile } = useProfile(id);
  const { data: issuesData } = useIssues(id);
  const { data: trustScore } = useTrustScore(id);
  const { data: preview } = usePreviewData(id);
  const downloadMut = useDownloadDataset();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="animate-spin" style={{ width: 32, height: 32, color: "#6366f1" }} />
          <p className="text-sm" style={{ color: "#64748b" }}>Loading dataset...</p>
        </div>
      </div>
    );
  }

  if (!dataset) {
    return (
      <div className="text-center py-20">
        <p className="text-sm" style={{ color: "#64748b" }}>Dataset not found</p>
        <Link to="/" className="mt-4 inline-block text-sm" style={{ color: "#6366f1" }}>← Back to Dashboard</Link>
      </div>
    );
  }

  if (["uploaded", "profiling"].includes(dataset.status)) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center"
          style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
        >
          <Sparkles style={{ width: 28, height: 28, color: "#6366f1" }} className="animate-pulse" />
        </div>
        <div className="text-center">
          <h3 className="text-base font-semibold text-white">Analyzing your dataset...</h3>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            Profiling columns, detecting issues, and calculating trust score
          </p>
        </div>
        <div className="flex gap-1.5">
          {["Profiling", "Detecting", "Scoring"].map((step, i) => (
            <span
              key={step}
              className="text-xs px-2 py-1 rounded-full"
              style={{
                background: "rgba(99,102,241,0.1)",
                color: "#a5b4fc",
                animationDelay: `${i * 0.3}s`,
              }}
            >
              {step}...
            </span>
          ))}
        </div>
      </div>
    );
  }

  const openIssues = issuesData?.issues?.filter((i) => i.status === "open") || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">{dataset.name}</h2>
          <p className="text-sm mt-0.5" style={{ color: "#64748b" }}>{dataset.original_filename}</p>
        </div>
        <div className="flex items-center gap-2">
          {openIssues.length > 0 && (
            <Link
              to={`/dataset/${id}/issues`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
              style={{
                background: "rgba(245,158,11,0.1)",
                color: "#f59e0b",
                border: "1px solid rgba(245,158,11,0.2)",
              }}
            >
              <AlertTriangle style={{ width: 13, height: 13 }} />
              {openIssues.length} Issues
            </Link>
          )}
          <button
            onClick={() => setShowCode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(99,102,241,0.1)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
          >
            <Code2 style={{ width: 13, height: 13 }} />
            Export Code
          </button>
          <button
            onClick={() => downloadMut.mutate({ id: dataset.id, name: dataset.name })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(255,255,255,0.04)",
              color: "#94a3b8",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <Download style={{ width: 13, height: 13 }} />
            Download
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div
        className="flex gap-1 rounded-xl p-1"
        style={{ background: "#111827", border: "1px solid #1e293b" }}
      >
        {tabs.map(({ id: tabId, label, icon: Icon }) => {
          const isActive = activeTab === tabId;
          return (
            <button
              key={tabId}
              onClick={() => setActiveTab(tabId)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all"
              style={{
                background: isActive ? "rgba(99,102,241,0.15)" : "transparent",
                color: isActive ? "#a5b4fc" : "#64748b",
                border: isActive ? "1px solid rgba(99,102,241,0.2)" : "1px solid transparent",
              }}
            >
              <Icon style={{ width: 14, height: 14 }} />
              {label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <OverviewTab dataset={dataset} trustScore={trustScore} issues={issuesData?.issues} profile={profile} datasetId={id} />
      )}
      {activeTab === "data" && <DataTab preview={preview} />}
      {activeTab === "columns" && <ColumnsTab profile={profile} />}
      {activeTab === "issues" && (
        <IssuesTab issues={issuesData?.issues} datasetId={id} />
      )}

      {showCode && (
        <CodeExportModal datasetId={id} onClose={() => setShowCode(false)} />
      )}
    </div>
  );
}

function OverviewTab({ dataset, trustScore, issues, profile, datasetId }) {
  return (
    <div className="space-y-5">
      {/* AI Insight Panel */}
      <AIInsightPanel datasetId={datasetId} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Trust Score */}
        <div
          className="rounded-xl p-5 flex flex-col items-center"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <TrustScoreGauge score={trustScore?.overall_score ?? dataset.trust_score ?? 0} />
          <div className="mt-4 w-full space-y-2">
            {trustScore?.dimensions?.map((dim) => (
              <div key={dim.name} className="flex items-center justify-between">
                <span className="text-xs" style={{ color: "#64748b" }}>{dim.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: "#1e293b" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${dim.score}%`,
                        background: dim.score >= 80 ? "#10b981" : dim.score >= 60 ? "#f59e0b" : "#ef4444",
                      }}
                    />
                  </div>
                  <span className="text-xs font-semibold text-white w-6 text-right">{Math.round(dim.score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Stats + Charts */}
        <div className="lg:col-span-2 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: "Rows", value: formatNumber(dataset.row_count) },
              { label: "Columns", value: formatNumber(dataset.column_count) },
              { label: "Open Issues", value: issues?.filter((i) => i.status === "open").length ?? 0 },
              { label: "Type", value: dataset.file_type.toUpperCase() },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="rounded-lg p-3 text-center"
                style={{ background: "#111827", border: "1px solid #1e293b" }}
              >
                <p className="text-lg font-bold text-white">{value}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{label}</p>
              </div>
            ))}
          </div>

          {issues && issues.length > 0 && (
            <div className="rounded-xl p-4" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-white">Issue Breakdown</h4>
                <Link
                  to={`/dataset/${datasetId}/issues`}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "#6366f1" }}
                >
                  View All <ArrowUpRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
              <IssueBreakdownChart issues={issues} />
            </div>
          )}

          {profile?.columns && (
            <div className="rounded-xl p-4" style={{ background: "#111827", border: "1px solid #1e293b" }}>
              <h4 className="text-sm font-semibold text-white mb-3">Column Types</h4>
              <div className="flex flex-wrap gap-2">
                {Object.entries(
                  profile.columns.reduce((acc, c) => {
                    acc[c.detected_type] = (acc[c.detected_type] || 0) + 1;
                    return acc;
                  }, {})
                ).map(([type, count]) => (
                  <span
                    key={type}
                    className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.15)" }}
                  >
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DataTab({ preview }) {
  if (!preview) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden" style={{ background: "#111827", border: "1px solid #1e293b" }}>
      <div
        className="px-4 py-3 flex items-center justify-between"
        style={{ borderBottom: "1px solid #1e293b" }}
      >
        <span className="text-sm font-medium text-white">
          Showing {preview.rows.length} of {formatNumber(preview.total_rows)} rows
        </span>
        <span className="text-xs" style={{ color: "#64748b" }}>{preview.columns.length} columns</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: "rgba(255,255,255,0.02)", borderBottom: "1px solid #1e293b" }}>
              <th className="px-3 py-2.5 text-left font-medium w-10 text-right" style={{ color: "#475569" }}>#</th>
              {preview.columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-medium whitespace-nowrap" style={{ color: "#94a3b8" }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, idx) => (
              <tr
                key={idx}
                className="transition-colors"
                style={{ borderBottom: "1px solid rgba(30,41,59,0.6)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                <td className="px-3 py-2 text-right" style={{ color: "#334155" }}>{idx + 1}</td>
                {preview.columns.map((col) => (
                  <td
                    key={col}
                    className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate"
                    style={{ color: row[col] == null ? "#ef4444" : "#cbd5e1" }}
                  >
                    {row[col] == null ? "null" : String(row[col])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ColumnsTab({ profile }) {
  if (!profile?.columns) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin" style={{ width: 20, height: 20, color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {profile.columns.map((col) => (
        <div
          key={col.id}
          className="rounded-xl p-5 transition-all"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "#334155"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#1e293b"; }}
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h4 className="font-semibold text-sm text-white">{col.column_name}</h4>
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{ background: "rgba(99,102,241,0.1)", color: "#a5b4fc" }}
              >
                {col.detected_type}
              </span>
            </div>
            {col.is_pii && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}
              >
                <Shield style={{ width: 9, height: 9 }} />
                PII: {col.pii_type}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Nulls", value: `${col.null_percentage}%`, bar: col.null_percentage, color: "#ef4444" },
              { label: "Unique", value: `${col.unique_percentage}%`, bar: col.unique_percentage, color: "#6366f1" },
              { label: "Duplicates", value: formatNumber(col.duplicate_count), bar: null, color: null },
            ].map(({ label, value, bar, color }) => (
              <div key={label}>
                <p className="text-[10px] font-medium uppercase tracking-wider mb-1" style={{ color: "#475569" }}>{label}</p>
                <p className="text-sm font-semibold text-white">{value}</p>
                {bar != null && (
                  <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "#1e293b" }}>
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.min(bar, 100)}%`, background: color }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>

          {col.mean_value != null && (
            <div
              className="text-[11px] rounded-lg px-3 py-2 mb-3"
              style={{ background: "rgba(255,255,255,0.03)", color: "#64748b" }}
            >
              Range: <span style={{ color: "#94a3b8" }}>{col.min_value} — {col.max_value}</span>
              &nbsp;·&nbsp; Mean: <span style={{ color: "#94a3b8" }}>{col.mean_value?.toFixed(2)}</span>
              &nbsp;·&nbsp; Median: <span style={{ color: "#94a3b8" }}>{col.median_value?.toFixed(2)}</span>
            </div>
          )}

          {col.distribution && (
            <DistributionChart data={col.distribution} type="numeric" />
          )}
          {!col.distribution && col.top_values && (
            <DistributionChart data={col.top_values} type="categorical" />
          )}
        </div>
      ))}
    </div>
  );
}

function IssuesTab({ issues, datasetId }) {
  if (!issues || issues.length === 0) {
    return (
      <div
        className="text-center py-12 rounded-xl"
        style={{ background: "#111827", border: "1px solid #1e293b" }}
      >
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "rgba(16,185,129,0.1)" }}
        >
          <AlertTriangle style={{ width: 20, height: 20, color: "#10b981" }} />
        </div>
        <p className="font-semibold text-white">No issues detected!</p>
        <p className="text-sm mt-1" style={{ color: "#64748b" }}>Your dataset looks clean.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={{ color: "#64748b" }}>
          {issues.length} issue{issues.length !== 1 ? "s" : ""} found
        </span>
        <Link
          to={`/dataset/${datasetId}/issues`}
          className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "#6366f1" }}
        >
          Repair Studio <ArrowUpRight style={{ width: 11, height: 11 }} />
        </Link>
      </div>
      {issues.map((issue) => (
        <div
          key={issue.id}
          className="rounded-xl p-4"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span
                className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 mt-0.5"
                style={getSeverityStyle(issue.severity)}
              >
                {issue.severity}
              </span>
              <div>
                <p className="text-sm font-medium text-white">{issue.description}</p>
                <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                  {issue.issue_type} · {issue.affected_count} rows affected
                </p>
              </div>
            </div>
            <span
              className="text-[10px] font-medium px-2 py-0.5 rounded-full flex-shrink-0"
              style={
                issue.status === "open"
                  ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                  : { background: "rgba(16,185,129,0.12)", color: "#10b981" }
              }
            >
              {issue.status}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}

function getSeverityStyle(sev) {
  const map = {
    critical: { background: "rgba(220,38,38,0.15)", color: "#dc2626" },
    high: { background: "rgba(239,68,68,0.12)", color: "#ef4444" },
    medium: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    low: { background: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  };
  return map[sev] || map.medium;
}

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle, Download, Loader2, Shield,
  Eye, BarChart3, Bug, Code2, ArrowUpRight, Sparkles, Rows3, GitBranch, Activity, Clock,
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
import LineageGraph from "../components/lineage/LineageGraph";
import DriftTab from "../components/drift/DriftTab";
import ContractTab from "../components/contracts/ContractTab";
import ScheduleTab from "../components/schedule/ScheduleTab";
import { formatNumber } from "../lib/utils";

const tabs = [
  { id: "overview",  label: "Overview",      icon: Eye },
  { id: "data",      label: "Data Preview",  icon: Rows3 },
  { id: "columns",   label: "Columns",       icon: BarChart3 },
  { id: "issues",    label: "Issues",        icon: Bug },
  { id: "lineage",   label: "Lineage",       icon: GitBranch },
  { id: "drift",     label: "Drift",         icon: Activity },
  { id: "contract",  label: "Contract",      icon: Code2 },
  { id: "schedule",  label: "Schedule",      icon: Clock },
];

const C = {
  card:    { background: "var(--bg-card)",   border: "1px solid var(--border)",       borderRadius: "0.75rem" },
  muted:   { color: "var(--text-muted)" },
  primary: { color: "var(--text-primary)" },
  accent:  { color: "var(--accent)" },
};

export default function DatasetExplorer() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCode, setShowCode] = useState(false);
  const { data: dataset, isLoading } = useDataset(id);
  const { data: profile }    = useProfile(id);
  const { data: issuesData } = useIssues(id);
  const { data: trustScore } = useTrustScore(id);
  const { data: preview }    = usePreviewData(id);
  const downloadMut = useDownloadDataset();

  if (isLoading) return <CenteredSpinner />;

  if (!dataset) return (
    <div className="text-center py-20">
      <p className="text-sm" style={C.muted}>Dataset not found</p>
      <Link to="/" style={{ color: "var(--accent)", textDecoration: "none", fontSize: 14, marginTop: 12, display: "inline-block" }}>← Dashboard</Link>
    </div>
  );

  if (["uploaded", "profiling"].includes(dataset.status)) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4">
      <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
        style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
        <Sparkles style={{ width: 26, height: 26, color: "var(--accent)" }} className="animate-pulse" />
      </div>
      <div className="text-center">
        <p className="font-semibold" style={C.primary}>Analyzing your dataset…</p>
        <p className="text-sm mt-1" style={C.muted}>Profiling columns, detecting issues, calculating trust score</p>
      </div>
    </div>
  );

  const openIssues = issuesData?.issues?.filter((i) => i.status === "open") || [];

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold" style={C.primary}>{dataset.name}</h2>
          <p className="text-xs mt-0.5" style={C.muted}>{dataset.original_filename}</p>
        </div>
        <div className="flex items-center gap-2">
          {openIssues.length > 0 && (
            <Link to={`/dataset/${id}/issues`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "rgba(245,158,11,0.1)", color: "var(--warning)", border: "1px solid rgba(245,158,11,0.2)", textDecoration: "none" }}>
              <AlertTriangle style={{ width: 12, height: 12 }} />{openIssues.length} Open Issues
            </Link>
          )}
          <button onClick={() => setShowCode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
            <Code2 style={{ width: 12, height: 12 }} />Export Code
          </button>
          <button onClick={() => downloadMut.mutate({ id: dataset.id, name: dataset.name })}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
            style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
            <Download style={{ width: 12, height: 12 }} />Download
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 rounded-xl p-1" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {tabs.map(({ id: tid, label, icon: Icon }) => {
          const active = activeTab === tid;
          return (
            <button key={tid} onClick={() => setActiveTab(tid)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all flex-1 justify-center"
              style={{
                background: active ? "var(--accent-bg)" : "transparent",
                color: active ? "var(--accent-light)" : "var(--text-muted)",
                border: active ? "1px solid var(--accent-border)" : "1px solid transparent",
              }}>
              <Icon style={{ width: 13, height: 13 }} />{label}
            </button>
          );
        })}
      </div>

      {activeTab === "overview" && <OverviewTab dataset={dataset} trustScore={trustScore} issues={issuesData?.issues} profile={profile} datasetId={id} />}
      {activeTab === "data"     && <DataTab preview={preview} />}
      {activeTab === "columns"  && <ColumnsTab profile={profile} />}
      {activeTab === "issues"   && <IssuesTab issues={issuesData?.issues} datasetId={id} />}
      {activeTab === "lineage"  && (
        <div className="space-y-3">
          <div>
            <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Data Lineage</h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>End-to-end flow of ingestion, profiling, issues, and repairs</p>
          </div>
          <LineageGraph datasetId={id} />
        </div>
      )}
      {activeTab === "drift"    && <DriftTab datasetId={id} />}
      {activeTab === "contract" && <ContractTab datasetId={id} />}
      {activeTab === "schedule" && <ScheduleTab datasetId={id} />}

      {showCode && <CodeExportModal datasetId={id} onClose={() => setShowCode(false)} />}
    </div>
  );
}

function OverviewTab({ dataset, trustScore, issues, profile, datasetId }) {
  const isProcessing = ["uploaded", "profiling", "profiled"].includes(dataset?.status);
  const displayScore = isProcessing ? null : (trustScore?.overall_score ?? dataset.trust_score);

  return (
    <div className="space-y-4">
      <AIInsightPanel datasetId={datasetId} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Trust score card */}
        <div className="rounded-xl p-6 flex flex-col items-center" style={C.card}>
          {isProcessing ? (
            <div className="flex flex-col items-center justify-center py-8 gap-3">
              <Loader2 style={{ width: 32, height: 32, color: "var(--accent)" }} className="animate-spin" />
              <p className="text-xs font-medium" style={C.muted}>Analyzing dataset...</p>
            </div>
          ) : (
            <TrustScoreGauge score={displayScore ?? 0} />
          )}
          <div className="mt-5 w-full space-y-2.5">
            {trustScore?.dimensions?.map((dim) => (
              <div key={dim.name} className="flex items-center justify-between gap-3">
                <span className="text-xs" style={C.muted}>{dim.name}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{
                      width: `${dim.score}%`,
                      background: dim.score >= 80 ? "#10b981" : dim.score >= 60 ? "#f59e0b" : "#ef4444",
                    }} />
                  </div>
                  <span className="text-xs font-semibold w-5 text-right" style={C.primary}>{Math.round(dim.score)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column */}
        <div className="lg:col-span-2 space-y-4">
          {/* Mini stats */}
          <div className="grid grid-cols-4 gap-3">
            {[
              { label: "Rows",       value: formatNumber(dataset.row_count) },
              { label: "Columns",    value: formatNumber(dataset.column_count) },
              { label: "Open Issues",value: issues?.filter((i) => i.status === "open").length ?? 0 },
              { label: "Format",     value: dataset.file_type.toUpperCase() },
            ].map(({ label, value }) => (
              <div key={label} className="rounded-xl p-3 text-center" style={C.card}>
                <p className="text-lg font-bold" style={C.primary}>{value}</p>
                <p className="text-[11px] mt-0.5" style={C.muted}>{label}</p>
              </div>
            ))}
          </div>

          {/* Issue breakdown */}
          {issues && issues.length > 0 && (
            <div className="rounded-xl p-4" style={C.card}>
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-semibold" style={C.primary}>Issue Breakdown</p>
                <Link to={`/dataset/${datasetId}/issues`}
                  className="flex items-center gap-1 text-xs font-medium"
                  style={{ color: "var(--accent)", textDecoration: "none" }}>
                  View All <ArrowUpRight style={{ width: 11, height: 11 }} />
                </Link>
              </div>
              <IssueBreakdownChart issues={issues} />
            </div>
          )}

          {/* Column types */}
          {profile?.columns && (
            <div className="rounded-xl p-4" style={C.card}>
              <p className="text-sm font-semibold mb-3" style={C.primary}>Column Types</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(profile.columns.reduce((acc, c) => {
                  acc[c.detected_type] = (acc[c.detected_type] || 0) + 1;
                  return acc;
                }, {})).map(([type, count]) => (
                  <span key={type} className="px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
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
  if (!preview) return <CenteredSpinner />;
  return (
    <div className="rounded-xl overflow-hidden" style={C.card}>
      <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <span className="text-sm font-medium" style={C.primary}>
          Showing {preview.rows.length} of {formatNumber(preview.total_rows)} rows
        </span>
        <span className="text-xs" style={C.muted}>{preview.columns.length} columns</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr style={{ background: "var(--bg-hover)", borderBottom: "1px solid var(--border)" }}>
              <th className="px-3 py-2.5 text-right font-semibold w-10 sticky left-0" style={{ color: "var(--text-faint)", background: "var(--bg-hover)" }}>#</th>
              {preview.columns.map((col) => (
                <th key={col} className="px-3 py-2.5 text-left font-semibold whitespace-nowrap" style={{ color: "var(--text-secondary)" }}>{col}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {preview.rows.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--bg-hover)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}>
                <td className="px-3 py-2 text-right" style={{ color: "var(--text-faint)" }}>{idx + 1}</td>
                {preview.columns.map((col) => (
                  <td key={col} className="px-3 py-2 whitespace-nowrap max-w-[180px] truncate"
                    style={{ color: row[col] == null ? "#ef4444" : "var(--text-primary)", fontStyle: row[col] == null ? "italic" : "normal" }}>
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
  if (!profile?.columns) return <CenteredSpinner />;
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {profile.columns.map((col) => (
        <div key={col.id} className="rounded-xl p-5 transition-all" style={C.card}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}>
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold text-sm" style={C.primary}>{col.column_name}</h4>
              <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold"
                style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}>
                {col.detected_type}
              </span>
            </div>
            {col.is_pii && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)" }}>
                <Shield style={{ width: 9, height: 9 }} />PII: {col.pii_type}
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-3">
            {[
              { label: "Nulls",      value: `${col.null_percentage}%`,          bar: col.null_percentage,      color: "#ef4444" },
              { label: "Unique",     value: `${col.unique_percentage}%`,         bar: col.unique_percentage,    color: "var(--accent)" },
              { label: "Duplicates", value: formatNumber(col.duplicate_count),   bar: null },
            ].map(({ label, value, bar, color }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-wider mb-1" style={C.muted}>{label}</p>
                <p className="text-sm font-semibold" style={C.primary}>{value}</p>
                {bar != null && (
                  <div className="h-1 rounded-full mt-1.5 overflow-hidden" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full" style={{ width: `${Math.min(bar, 100)}%`, background: color }} />
                  </div>
                )}
              </div>
            ))}
          </div>

          {col.mean_value != null && (
            <div className="text-[11px] rounded-lg px-3 py-2 mb-3"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
              Range: <b style={C.primary}>{col.min_value} — {col.max_value}</b>
              {" · "}Mean: <b style={C.primary}>{col.mean_value?.toFixed(2)}</b>
              {" · "}Median: <b style={C.primary}>{col.median_value?.toFixed(2)}</b>
            </div>
          )}

          {col.distribution && <DistributionChart data={col.distribution} type="numeric" />}
          {!col.distribution && col.top_values && <DistributionChart data={col.top_values} type="categorical" />}
        </div>
      ))}
    </div>
  );
}

function IssuesTab({ issues, datasetId }) {
  if (!issues || issues.length === 0) return (
    <div className="text-center py-12 rounded-xl" style={C.card}>
      <p className="font-semibold" style={C.primary}>No issues detected</p>
      <p className="text-sm mt-1" style={C.muted}>Your dataset looks clean.</p>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm" style={C.muted}>{issues.length} issue{issues.length !== 1 ? "s" : ""}</span>
        <Link to={`/dataset/${datasetId}/issues`} className="flex items-center gap-1 text-xs font-medium"
          style={{ color: "var(--accent)", textDecoration: "none" }}>
          Repair Studio <ArrowUpRight style={{ width: 11, height: 11 }} />
        </Link>
      </div>
      {issues.map((issue) => (
        <div key={issue.id} className="rounded-xl p-4" style={C.card}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <SeverityBadge sev={issue.severity} />
              <div>
                <p className="text-sm font-medium" style={C.primary}>{issue.description}</p>
                <p className="text-xs mt-0.5" style={C.muted}>{issue.issue_type} · {issue.affected_count} rows</p>
              </div>
            </div>
            <StatusBadge status={issue.status} />
          </div>
        </div>
      ))}
    </div>
  );
}

function CenteredSpinner() {
  return (
    <div className="flex items-center justify-center h-40">
      <Loader2 className="animate-spin" style={{ width: 22, height: 22, color: "var(--accent)" }} />
    </div>
  );
}

function SeverityBadge({ sev }) {
  const map = {
    critical: { background: "rgba(220,38,38,0.12)",   color: "#dc2626" },
    high:     { background: "rgba(239,68,68,0.1)",    color: "#ef4444" },
    medium:   { background: "rgba(245,158,11,0.1)",   color: "#f59e0b" },
    low:      { background: "rgba(100,116,139,0.1)",  color: "#94a3b8" },
  };
  const s = map[sev] || map.medium;
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0 mt-0.5" style={s}>{sev}</span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex-shrink-0"
      style={status === "open"
        ? { background: "rgba(245,158,11,0.1)", color: "var(--warning)" }
        : { background: "rgba(16,185,129,0.1)", color: "var(--success)" }}>
      {status}
    </span>
  );
}

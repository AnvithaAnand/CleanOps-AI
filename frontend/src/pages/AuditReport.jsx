import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Loader2, Upload, BarChart3, AlertTriangle,
  Wrench, Download, Clock,
} from "lucide-react";
import { useAuditLog } from "../hooks/useAudit";
import { useDataset } from "../hooks/useDatasets";
import { formatDate } from "../lib/utils";

const actionConfig = {
  upload:         { icon: Upload,        color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  profile:        { icon: BarChart3,     color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  validate:       { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  repair_applied: { icon: Wrench,        color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  download:       { icon: Download,      color: "#64748b", bg: "rgba(100,116,139,0.12)" },
};

export default function AuditReport() {
  const { id } = useParams();
  const { data: dataset } = useDataset(id);
  const { data: logs, isLoading } = useAuditLog(id);

  const handleExportCSV = () => {
    if (!logs) return;
    const headers = ["Timestamp", "Action", "Description"];
    const rows = logs.map((l) => [
      formatDate(l.created_at),
      l.action,
      `"${l.description.replace(/"/g, '""')}"`,
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${dataset?.name || "dataset"}_audit_log.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--accent)" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">

      {/* ── Page Header ─────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <ArrowLeft style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
          </Link>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Audit Report</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {dataset?.name} · {logs?.length || 0} entries
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!logs || logs.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{
            background: "var(--bg-hover)",
            color: "var(--text-secondary)",
            border: "1px solid var(--border)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          <Download style={{ width: 13, height: 13 }} />
          Export CSV
        </button>
      </div>

      {/* ── Timeline / Empty ────────────────────────── */}
      {!logs || logs.length === 0 ? (
        <div
          className="text-center py-16 rounded-2xl"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <Clock style={{ width: 28, height: 28, color: "var(--text-faint)" }} className="mx-auto mb-3" />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>No audit entries yet</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Actions will appear here once you upload or repair data</p>
        </div>
      ) : (
        <div
          className="rounded-2xl p-6"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          {/* Color bar */}
          <div
            className="h-0.5 w-full -mt-6 -mx-6 mb-6 rounded-t-2xl"
            style={{ width: "calc(100% + 3rem)", background: "linear-gradient(90deg, #6366f1, #06b6d4)" }}
          />
          <div className="relative">
            {/* vertical line */}
            <div
              className="absolute left-5 top-0 bottom-0 w-px"
              style={{ background: `linear-gradient(to bottom, rgba(99,102,241,0.4), transparent)` }}
            />
            <div className="space-y-5">
              {logs.map((log) => {
                const cfg = actionConfig[log.action] || {
                  icon: Clock, color: "var(--text-muted)", bg: "var(--bg-hover)",
                };
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="relative pl-14 animate-fade-in">
                    <div
                      className="absolute left-2.5 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}40` }}
                    >
                      <Icon style={{ width: 12, height: 12, color: cfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-sm font-semibold capitalize"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                        {log.description}
                      </p>
                      {log.metadata_json && typeof log.metadata_json === "object" && (
                        <div
                          className="mt-2 rounded-lg p-3 text-xs font-mono"
                          style={{
                            background: "var(--bg-hover)",
                            border: "1px solid var(--border)",
                          }}
                        >
                          {Object.entries(log.metadata_json).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span style={{ color: "var(--accent)" }}>{k}:</span>
                              <span style={{ color: "var(--text-secondary)" }}>{String(v)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

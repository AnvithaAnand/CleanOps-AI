import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft, Loader2, Upload, BarChart3, AlertTriangle,
  Wrench, Download, Clock,
} from "lucide-react";
import { useAuditLog } from "../hooks/useAudit";
import { useDataset } from "../hooks/useDatasets";
import { formatDate } from "../lib/utils";

const actionConfig = {
  upload: { icon: Upload, color: "#3b82f6", bg: "rgba(59,130,246,0.12)" },
  profile: { icon: BarChart3, color: "#8b5cf6", bg: "rgba(139,92,246,0.12)" },
  validate: { icon: AlertTriangle, color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  repair_applied: { icon: Wrench, color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  download: { icon: Download, color: "#64748b", bg: "rgba(100,116,139,0.12)" },
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
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#6366f1" }} />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <ArrowLeft style={{ width: 14, height: 14, color: "#94a3b8" }} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Audit Report</h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {dataset?.name} · {logs?.length || 0} entries
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!logs || logs.length === 0}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all disabled:opacity-40"
          style={{ background: "rgba(255,255,255,0.04)", color: "#94a3b8", border: "1px solid rgba(255,255,255,0.08)" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
        >
          <Download style={{ width: 13, height: 13 }} />
          Export CSV
        </button>
      </div>

      {!logs || logs.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <Clock style={{ width: 24, height: 24, color: "#334155" }} className="mx-auto mb-2" />
          <p className="text-sm" style={{ color: "#475569" }}>No audit entries yet</p>
        </div>
      ) : (
        <div className="rounded-xl p-6" style={{ background: "#111827", border: "1px solid #1e293b" }}>
          <div className="relative">
            <div
              className="absolute left-5 top-0 bottom-0 w-px"
              style={{ background: "linear-gradient(to bottom, rgba(99,102,241,0.3), transparent)" }}
            />
            <div className="space-y-5">
              {logs.map((log) => {
                const cfg = actionConfig[log.action] || {
                  icon: Clock, color: "#64748b", bg: "rgba(100,116,139,0.12)",
                };
                const Icon = cfg.icon;
                return (
                  <div key={log.id} className="relative pl-14 animate-fade-in">
                    <div
                      className="absolute left-2.5 w-6 h-6 rounded-full flex items-center justify-center"
                      style={{ background: cfg.bg, border: `1px solid ${cfg.color}30` }}
                    >
                      <Icon style={{ width: 12, height: 12, color: cfg.color }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-white capitalize">
                          {log.action.replace(/_/g, " ")}
                        </span>
                        <span className="text-xs" style={{ color: "#475569" }}>
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
                        {log.description}
                      </p>
                      {log.metadata_json && typeof log.metadata_json === "object" && (
                        <div
                          className="mt-2 rounded-lg p-3 text-xs font-mono"
                          style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}
                        >
                          {Object.entries(log.metadata_json).map(([k, v]) => (
                            <div key={k} className="flex gap-2">
                              <span style={{ color: "#6366f1" }}>{k}:</span>
                              <span style={{ color: "#94a3b8" }}>{String(v)}</span>
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

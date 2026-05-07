import { Link } from "react-router-dom";
import { FileSpreadsheet, Rows3, Columns3, Clock, AlertTriangle } from "lucide-react";
import TrustScoreBadge from "./TrustScoreBadge";
import { formatDate, formatNumber } from "../../lib/utils";

const statusConfig = {
  uploaded: { color: "var(--text-muted)",   bg: "var(--bg-hover)", label: "Uploaded" },
  profiling: { color: "#3b82f6",            bg: "rgba(59,130,246,0.1)", label: "Profiling..." },
  profiled:  { color: "var(--accent)",      bg: "var(--accent-bg)", label: "Profiled" },
  validated: { color: "var(--success)",     bg: "rgba(16,185,129,0.1)", label: "Validated" },
  error:     { color: "var(--danger)",      bg: "rgba(239,68,68,0.1)", label: "Error" },
};

export default function DatasetCard({ dataset }) {
  const status = statusConfig[dataset.status] || statusConfig.uploaded;
  const isProcessing = ["uploaded", "profiling"].includes(dataset.status);

  return (
    <Link
      to={`/dataset/${dataset.id}`}
      className="block rounded-xl p-5 transition-all duration-200 group"
      style={{ background: "var(--bg-card)", border: `1px solid var(--border)`, textDecoration: "none" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-strong)";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--border)";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}
          >
            <FileSpreadsheet style={{ width: 18, height: 18, color: "var(--accent)" }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate max-w-[140px] transition-colors" style={{ color: "var(--text-primary)" }}>
              {dataset.name}
            </h3>
            <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "var(--text-faint)" }}>
              {dataset.original_filename}
            </p>
          </div>
        </div>
        <TrustScoreBadge score={dataset.trust_score} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Rows3,    val: `${formatNumber(dataset.row_count)} rows` },
          { icon: Columns3, val: `${formatNumber(dataset.column_count)} cols` },
          { icon: Clock,    val: formatDate(dataset.created_at).split(",")[0] },
        ].map(({ icon: Icon, val }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon style={{ width: 11, height: 11, color: "var(--text-faint)", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span
            className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.color }}
          >
            {isProcessing && (
              <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: status.color }} />
            )}
            {status.label}
          </span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
            style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}
          >
            {dataset.file_type}
          </span>
        </div>
        {dataset.trust_score != null && dataset.trust_score < 80 && (
          <div className="flex items-center gap-1">
            <AlertTriangle style={{ width: 11, height: 11, color: "var(--warning)" }} />
            <span className="text-[11px]" style={{ color: "var(--warning)" }}>Needs attention</span>
          </div>
        )}
      </div>
    </Link>
  );
}

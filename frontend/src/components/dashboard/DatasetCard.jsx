import { Link } from "react-router-dom";
import { FileSpreadsheet, Rows3, Columns3, Clock, AlertTriangle } from "lucide-react";
import TrustScoreBadge from "./TrustScoreBadge";
import { formatDate, formatNumber } from "../../lib/utils";

const statusConfig = {
  uploaded: { color: "#64748b", bg: "rgba(100,116,139,0.12)", label: "Uploaded" },
  profiling: { color: "#3b82f6", bg: "rgba(59,130,246,0.12)", label: "Profiling..." },
  profiled: { color: "#6366f1", bg: "rgba(99,102,241,0.12)", label: "Profiled" },
  validated: { color: "#10b981", bg: "rgba(16,185,129,0.12)", label: "Validated" },
  error: { color: "#ef4444", bg: "rgba(239,68,68,0.12)", label: "Error" },
};

export default function DatasetCard({ dataset }) {
  const status = statusConfig[dataset.status] || statusConfig.uploaded;
  const isProcessing = ["uploaded", "profiling"].includes(dataset.status);

  return (
    <Link
      to={`/dataset/${dataset.id}`}
      className="block rounded-xl p-5 transition-all duration-200 group"
      style={{
        background: "#111827",
        border: "1px solid #1e293b",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.border = "1px solid #334155";
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 8px 30px rgba(0,0,0,0.4)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.border = "1px solid #1e293b";
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      {/* Top Row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.2)" }}
          >
            <FileSpreadsheet style={{ width: 18, height: 18, color: "#6366f1" }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-white truncate max-w-[140px] group-hover:text-indigo-300 transition-colors">
              {dataset.name}
            </h3>
            <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "#475569" }}>
              {dataset.original_filename}
            </p>
          </div>
        </div>
        <TrustScoreBadge score={dataset.trust_score} />
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Rows3, val: formatNumber(dataset.row_count), label: "rows" },
          { icon: Columns3, val: formatNumber(dataset.column_count), label: "cols" },
          { icon: Clock, val: formatDate(dataset.created_at).split(",")[0], label: "" },
        ].map(({ icon: Icon, val, label }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon style={{ width: 12, height: 12, color: "#475569", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "#64748b" }}>
              {val} {label}
            </span>
          </div>
        ))}
      </div>

      {/* Bottom Row */}
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
            className="text-[10px] font-medium px-1.5 py-0.5 rounded uppercase"
            style={{ background: "rgba(255,255,255,0.05)", color: "#475569" }}
          >
            {dataset.file_type}
          </span>
        </div>

        {dataset.trust_score != null && dataset.trust_score < 80 && (
          <div className="flex items-center gap-1">
            <AlertTriangle style={{ width: 11, height: 11, color: "#f59e0b" }} />
            <span className="text-[11px]" style={{ color: "#f59e0b" }}>Needs attention</span>
          </div>
        )}
      </div>
    </Link>
  );
}

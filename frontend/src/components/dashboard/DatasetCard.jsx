import { Link } from "react-router-dom";
import {
  FileSpreadsheet,
  Rows3,
  Columns3,
  Clock,
} from "lucide-react";
import TrustScoreBadge from "./TrustScoreBadge";
import { formatBytes, formatDate, formatNumber } from "../../lib/utils";

const statusColors = {
  uploaded: "bg-gray-100 text-gray-700",
  profiling: "bg-blue-100 text-blue-700",
  profiled: "bg-blue-100 text-blue-700",
  validated: "bg-green-100 text-green-700",
  error: "bg-red-100 text-red-700",
};

export default function DatasetCard({ dataset }) {
  return (
    <Link
      to={`/dataset/${dataset.id}`}
      className="block bg-card border border-border rounded-xl p-5 hover:shadow-md transition-shadow"
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground text-sm">
              {dataset.name}
            </h3>
            <p className="text-xs text-muted-foreground">
              {dataset.original_filename}
            </p>
          </div>
        </div>
        <TrustScoreBadge score={dataset.trust_score} />
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Rows3 className="w-3.5 h-3.5" />
          {formatNumber(dataset.row_count)} rows
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Columns3 className="w-3.5 h-3.5" />
          {formatNumber(dataset.column_count)} cols
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="w-3.5 h-3.5" />
          {formatDate(dataset.created_at).split(",")[0]}
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <span
          className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase ${
            statusColors[dataset.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {dataset.status}
        </span>
        <span className="text-[10px] text-muted-foreground uppercase">
          {dataset.file_type}
        </span>
      </div>
    </Link>
  );
}

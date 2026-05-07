import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  Upload,
  BarChart3,
  AlertTriangle,
  Wrench,
  Download,
  Clock,
} from "lucide-react";
import { useAuditLog } from "../hooks/useAudit";
import { useDataset } from "../hooks/useDatasets";
import { formatDate } from "../lib/utils";

const actionIcons = {
  upload: Upload,
  profile: BarChart3,
  validate: AlertTriangle,
  repair_applied: Wrench,
  download: Download,
};

const actionColors = {
  upload: "bg-blue-100 text-blue-600",
  profile: "bg-purple-100 text-purple-600",
  validate: "bg-yellow-100 text-yellow-600",
  repair_applied: "bg-green-100 text-green-600",
  download: "bg-gray-100 text-gray-600",
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold">Audit Report</h2>
            <p className="text-sm text-muted-foreground">
              {dataset?.name} — {logs?.length || 0} entries
            </p>
          </div>
        </div>
        <button
          onClick={handleExportCSV}
          disabled={!logs || logs.length === 0}
          className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm font-medium hover:bg-muted transition-colors disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {!logs || logs.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-xl text-muted-foreground">
          No audit entries yet
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="relative">
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-border" />
            <div className="space-y-6">
              {logs.map((log) => {
                const Icon = actionIcons[log.action] || Clock;
                const color = actionColors[log.action] || "bg-gray-100 text-gray-600";
                return (
                  <div key={log.id} className="relative pl-14">
                    <div
                      className={`absolute left-3 w-7 h-7 rounded-full flex items-center justify-center ${color}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium capitalize">
                          {log.action.replace("_", " ")}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(log.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {log.description}
                      </p>
                      {log.metadata_json && typeof log.metadata_json === "object" && (
                        <div className="mt-2 bg-muted/50 rounded-lg p-3 text-xs font-mono">
                          {Object.entries(log.metadata_json).map(([k, v]) => (
                            <div key={k}>
                              <span className="text-muted-foreground">{k}:</span>{" "}
                              {String(v)}
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

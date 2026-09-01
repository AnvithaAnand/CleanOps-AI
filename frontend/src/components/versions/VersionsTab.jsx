import { GitBranch, Download, Loader2, FileText } from "lucide-react";
import { useVersions } from "../../hooks/useAudit";
import { useDownloadDataset } from "../../hooks/useDatasets";
import { formatDate, formatNumber } from "../../lib/utils";

export default function VersionsTab({ datasetId }) {
  const { data: versions, isLoading } = useVersions(datasetId);
  const downloadMut = useDownloadDataset();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-40">
        <Loader2 className="animate-spin" style={{ width: 22, height: 22, color: "var(--accent)" }} />
      </div>
    );
  }

  if (!versions?.length) {
    return (
      <div className="text-center py-12 rounded-xl"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
          style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
          <GitBranch style={{ width: 20, height: 20, color: "var(--accent)" }} />
        </div>
        <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No versions yet</p>
        <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
          Versions are created when repairs or re-uploads modify the dataset.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Version History</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          {versions.length} version{versions.length !== 1 ? "s" : ""} recorded
        </p>
      </div>

      <div className="relative">
        {/* Timeline line */}
        <div className="absolute left-4 top-0 bottom-0 w-px" style={{ background: "var(--border)" }} />

        <div className="space-y-3">
          {versions.map((v, idx) => (
            <div key={v.id} className="relative flex items-start gap-4 pl-10">
              {/* Timeline dot */}
              <div className="absolute left-2.5 top-4 w-3 h-3 rounded-full border-2 flex-shrink-0"
                style={{
                  background: idx === 0 ? "var(--accent)" : "var(--bg-card)",
                  borderColor: idx === 0 ? "var(--accent)" : "var(--border)",
                  boxShadow: idx === 0 ? "0 0 8px rgba(99,102,241,0.4)" : "none",
                }} />

              <div className="flex-1 rounded-xl p-4"
                style={{ background: "var(--bg-card)", border: `1px solid ${idx === 0 ? "var(--accent-border)" : "var(--border)"}` }}>
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                        v{v.version_number}
                      </span>
                      {idx === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
                          Latest
                        </span>
                      )}
                    </div>
                    <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                      {formatDate(v.created_at)}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg"
                      style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
                      <FileText style={{ width: 10, height: 10 }} />
                      {formatNumber(v.row_count)} rows
                    </span>
                    <button
                      onClick={() => downloadMut.mutate({ id: datasetId, name: `v${v.version_number}`, version: v.version_number })}
                      className="flex items-center gap-1 text-xs px-2 py-1 rounded-lg font-medium transition-all"
                      style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
                      <Download style={{ width: 10, height: 10 }} />
                      Download
                    </button>
                  </div>
                </div>

                {v.change_summary && (
                  <p className="text-xs mt-2 px-3 py-2 rounded-lg"
                    style={{ background: "var(--bg-hover)", color: "var(--text-secondary)", border: "1px solid var(--border)" }}>
                    {v.change_summary}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

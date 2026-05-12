import { useState } from "react";
import { Loader2, CheckCircle, XCircle, Clock, ChevronDown } from "lucide-react";
import { useJobs } from "../../hooks/useJobs";
import { formatDate } from "../../lib/utils";

const typeLabels = {
  profile: "Profiling",
  repair: "Repairing",
  import: "Importing",
  drift_scan: "Drift Scan",
};

const statusConfig = {
  pending: { icon: Clock, color: "var(--text-muted)", label: "Pending" },
  running: { icon: Loader2, color: "var(--accent)", label: "Running", spin: true },
  completed: { icon: CheckCircle, color: "var(--success)", label: "Done" },
  failed: { icon: XCircle, color: "var(--danger)", label: "Failed" },
};

export default function JobStatusIndicator() {
  const [open, setOpen] = useState(false);
  const { data: jobs } = useJobs({ limit: 10 });

  const running = jobs?.filter((j) => j.status === "running" || j.status === "pending") || [];

  if (!jobs || jobs.length === 0) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all"
        style={{
          background: running.length > 0 ? "var(--accent-bg)" : "var(--bg-hover)",
          color: running.length > 0 ? "var(--accent-light)" : "var(--text-muted)",
          border: `1px solid ${running.length > 0 ? "var(--accent-border)" : "var(--border)"}`,
        }}
      >
        {running.length > 0 ? (
          <>
            <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
            {running.length} running
          </>
        ) : (
          <>
            <CheckCircle style={{ width: 12, height: 12 }} />
            Jobs
          </>
        )}
        <ChevronDown style={{ width: 10, height: 10 }} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-80 rounded-xl overflow-hidden z-50 animate-fade-in"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border)" }}>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Recent Jobs</p>
            </div>
            <div className="max-h-64 overflow-y-auto">
              {jobs.map((job) => {
                const cfg = statusConfig[job.status] || statusConfig.pending;
                const Icon = cfg.icon;
                return (
                  <div
                    key={job.id}
                    className="flex items-center gap-3 px-4 py-2.5"
                    style={{ borderBottom: "1px solid var(--border)" }}
                  >
                    <Icon
                      style={{ width: 14, height: 14, color: cfg.color, flexShrink: 0 }}
                      className={cfg.spin ? "animate-spin" : ""}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                        {typeLabels[job.job_type] || job.job_type}
                      </p>
                      <p className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                        {cfg.label}
                        {job.progress != null && job.status === "running" && ` · ${job.progress}%`}
                        {job.error_message && ` · ${job.error_message.slice(0, 40)}`}
                      </p>
                    </div>
                    <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                      {formatDate(job.created_at)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

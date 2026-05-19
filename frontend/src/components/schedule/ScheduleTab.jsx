import { useState } from "react";
import { Clock, Play, Square, Trash2, RefreshCw } from "lucide-react";
import { useSchedule, useSetSchedule, useRemoveSchedule } from "../../hooks/useSchedule";

const FREQUENCIES = [
  { value: "hourly", label: "Hourly",  desc: "Re-profile every hour" },
  { value: "daily",  label: "Daily",   desc: "Re-profile once a day" },
  { value: "weekly", label: "Weekly",  desc: "Re-profile once a week" },
];

function formatDt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export default function ScheduleTab({ datasetId }) {
  const { data: schedule, isLoading } = useSchedule(datasetId);
  const setSchedule = useSetSchedule(datasetId);
  const removeSchedule = useRemoveSchedule(datasetId);
  const [selected, setSelected] = useState("daily");

  const active = schedule?.is_active;

  if (isLoading) {
    return <div className="h-32 shimmer rounded-xl" />;
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Scheduled Scans</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Automatically re-profile this dataset on a recurring schedule. Each scan updates the trust score, detects drift, and evaluates alert rules.
        </p>
      </div>

      {/* Current schedule status */}
      {schedule ? (
        <div
          className="rounded-xl p-4 flex items-start justify-between gap-4"
          style={{ background: "var(--bg-card)", border: `1px solid ${active ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: active ? "rgba(16,185,129,0.1)" : "var(--bg-hover)" }}
            >
              <RefreshCw style={{ width: 16, height: 16, color: active ? "var(--success)" : "var(--text-faint)" }} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold capitalize" style={{ color: "var(--text-primary)" }}>
                  {schedule.frequency} scan
                </p>
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                  style={{
                    background: active ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                    color: active ? "var(--success)" : "var(--danger)",
                  }}
                >
                  {active ? "ACTIVE" : "PAUSED"}
                </span>
              </div>
              <div className="flex items-center gap-4 mt-1">
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Last run: {formatDt(schedule.last_run_at)}
                </span>
                <span className="text-xs" style={{ color: "var(--text-faint)" }}>
                  Next run: {active ? formatDt(schedule.next_run_at) : "—"}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setSchedule.mutate({ frequency: schedule.frequency, is_active: !active })}
              disabled={setSchedule.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
              style={{
                background: active ? "rgba(239,68,68,0.1)" : "rgba(16,185,129,0.1)",
                color: active ? "var(--danger)" : "var(--success)",
                border: `1px solid ${active ? "rgba(239,68,68,0.2)" : "rgba(16,185,129,0.2)"}`,
              }}
            >
              {active ? <Square style={{ width: 11, height: 11 }} /> : <Play style={{ width: 11, height: 11 }} />}
              {active ? "Pause" : "Resume"}
            </button>
            <button
              onClick={() => removeSchedule.mutate()}
              disabled={removeSchedule.isPending}
              className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
              style={{ color: "var(--text-faint)", border: "1px solid var(--border)" }}
              title="Remove schedule"
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
          </div>
        </div>
      ) : (
        <div
          className="rounded-xl p-4"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
        >
          <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>No schedule set. Choose a frequency to start automatic scans:</p>
          <div className="grid grid-cols-3 gap-3 mb-4">
            {FREQUENCIES.map(({ value, label, desc }) => (
              <button
                key={value}
                onClick={() => setSelected(value)}
                className="rounded-lg p-3 text-left transition-all"
                style={{
                  background: selected === value ? "var(--accent-bg)" : "var(--bg-hover)",
                  border: `1px solid ${selected === value ? "var(--accent-border)" : "var(--border)"}`,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: selected === value ? "var(--accent-light)" : "var(--text-primary)" }}>
                  {label}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>{desc}</p>
              </button>
            ))}
          </div>
          <button
            onClick={() => setSchedule.mutate({ frequency: selected, is_active: true })}
            disabled={setSchedule.isPending}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}
          >
            <Clock style={{ width: 12, height: 12 }} />
            {setSchedule.isPending ? "Saving..." : `Enable ${selected} scan`}
          </button>
        </div>
      )}

      {/* Info box */}
      <div
        className="rounded-lg p-3 text-xs space-y-1"
        style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--text-muted)" }}
      >
        <p><span style={{ color: "var(--accent-light)" }} className="font-semibold">What happens on each scan:</span></p>
        <p>• Re-profiles the dataset and updates the trust score</p>
        <p>• Compares against the baseline to detect schema/distribution/volume drift</p>
        <p>• Evaluates all active alert rules and fires alerts on violations</p>
        <p>• Each scan creates a job entry visible in the Job Status indicator</p>
      </div>
    </div>
  );
}

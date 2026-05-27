import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Wrench, Play, ToggleLeft, ToggleRight, Zap } from "lucide-react";
import client from "../../api/client";

const SAFE_STRATEGIES = [
  "fill_mean — fill numeric nulls with column mean",
  "fill_median — fill numeric nulls with column median",
  "fill_mode — fill categorical nulls with most frequent value",
  "remove_duplicates — remove exact duplicate rows",
  "fill_empty_string — fill text nulls with empty string",
];

function useAutoRepairConfig(datasetId) {
  return useQuery({
    queryKey: ["auto-repair", datasetId],
    queryFn: () => client.get(`/api/auto-repair/${datasetId}`).then((r) => r.data),
    enabled: !!datasetId,
  });
}

export default function AutoRepairTab({ datasetId }) {
  const qc = useQueryClient();
  const { data: config, isLoading } = useAutoRepairConfig(datasetId);
  const [confidence, setConfidence] = useState(0.8);

  const save = useMutation({
    mutationFn: (body) => client.put(`/api/auto-repair/${datasetId}`, body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["auto-repair", datasetId] }),
  });

  const runNow = useMutation({
    mutationFn: () => client.post(`/api/auto-repair/${datasetId}/run`).then((r) => r.data),
  });

  const isActive = config?.is_active ?? false;
  const currentConfidence = config?.min_confidence ?? 0.8;

  if (isLoading) return <div className="h-32 shimmer rounded-xl" />;

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Auto-Repair Mode</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Automatically apply safe, high-confidence repairs after each scheduled scan.
        </p>
      </div>

      {/* Toggle */}
      <div className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{ background: "var(--bg-card)", border: `1px solid ${isActive ? "rgba(16,185,129,0.3)" : "var(--border)"}` }}>
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: isActive ? "rgba(16,185,129,0.1)" : "var(--bg-hover)" }}>
            <Wrench style={{ width: 16, height: 16, color: isActive ? "var(--success)" : "var(--text-faint)" }} />
          </div>
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              Auto-repair is {isActive ? "enabled" : "disabled"}
            </p>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {isActive
                ? `Applying repairs with ≥${Math.round(currentConfidence * 100)}% confidence after each scan`
                : "Enable to automatically fix issues after scheduled scans"}
            </p>
          </div>
        </div>
        <button onClick={() => save.mutate({ is_active: !isActive, min_confidence: currentConfidence })}
          disabled={save.isPending}>
          {isActive
            ? <ToggleRight style={{ width: 28, height: 28, color: "var(--success)" }} />
            : <ToggleLeft style={{ width: 28, height: 28, color: "var(--text-faint)" }} />}
        </button>
      </div>

      {/* Confidence threshold */}
      <div className="rounded-xl p-4 space-y-3"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Confidence Threshold</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          Only repairs above this confidence level will be applied automatically.
        </p>
        <div className="flex items-center gap-4">
          <input type="range" min={0.5} max={1.0} step={0.05}
            value={confidence}
            onChange={(e) => setConfidence(Number(e.target.value))}
            className="flex-1" />
          <span className="text-sm font-bold w-12 text-right" style={{ color: "var(--accent)" }}>
            {Math.round(confidence * 100)}%
          </span>
        </div>
        <button
          onClick={() => save.mutate({ is_active: isActive, min_confidence: confidence })}
          disabled={save.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}>
          {save.isPending ? "Saving..." : "Save Threshold"}
        </button>
      </div>

      {/* Run now */}
      <div className="rounded-xl p-4 flex items-center justify-between gap-4"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Run Now</p>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Immediately apply all safe recommended repairs without waiting for a scheduled scan.
          </p>
        </div>
        <button
          onClick={() => runNow.mutate()}
          disabled={runNow.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold flex-shrink-0"
          style={{ background: "rgba(16,185,129,0.1)", color: "var(--success)", border: "1px solid rgba(16,185,129,0.2)" }}>
          {runNow.isPending
            ? <><Zap style={{ width: 11, height: 11 }} />Running...</>
            : <><Play style={{ width: 11, height: 11 }} />Run Now</>}
        </button>
      </div>
      {runNow.isSuccess && (
        <p className="text-xs" style={{ color: "var(--success)" }}>
          Auto-repair started — check the Jobs indicator for progress.
        </p>
      )}

      {/* Safe strategies info */}
      <div className="rounded-lg p-3 space-y-1.5"
        style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
        <p className="text-xs font-semibold" style={{ color: "var(--accent-light)" }}>Safe repair strategies:</p>
        {SAFE_STRATEGIES.map((s) => (
          <p key={s} className="text-[11px]" style={{ color: "var(--text-muted)" }}>• {s}</p>
        ))}
      </div>
    </div>
  );
}

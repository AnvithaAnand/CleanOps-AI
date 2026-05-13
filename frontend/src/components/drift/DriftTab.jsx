import { AlertTriangle, RefreshCw, TrendingDown, ArrowRightLeft, BarChart2, Loader2 } from "lucide-react";
import { useDrift, useResetBaseline } from "../../hooks/useDrift";

const severityConfig = {
  high:   { color: "var(--danger)",  bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.25)",   label: "High" },
  medium: { color: "#f59e0b",         bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.25)",  label: "Medium" },
  low:    { color: "var(--success)", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.25)", label: "Low" },
};

const driftTypeConfig = {
  schema:       { Icon: ArrowRightLeft, label: "Schema Drift" },
  distribution: { Icon: BarChart2,      label: "Distribution Drift" },
  volume:       { Icon: TrendingDown,   label: "Volume Drift" },
};

function SeverityBadge({ severity }) {
  const cfg = severityConfig[severity] || severityConfig.low;
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}` }}
    >
      {cfg.label}
    </span>
  );
}

function DriftGroup({ type, reports }) {
  const { Icon, label } = driftTypeConfig[type] || { Icon: AlertTriangle, label: type };
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <Icon style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{label}</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded"
          style={{ background: "var(--accent-bg)", color: "var(--accent)" }}
        >
          {reports.length}
        </span>
      </div>
      <div className="space-y-2">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-xl px-4 py-3 flex items-start gap-3"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
          >
            <SeverityBadge severity={r.severity} />
            <div className="flex-1 min-w-0">
              <p className="text-xs" style={{ color: "var(--text-primary)" }}>{r.description}</p>
              {r.baseline_value && r.current_value && (
                <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                  Baseline: <span style={{ color: "var(--text-primary)" }}>{r.baseline_value}</span>
                  {" → "}
                  Current: <span style={{ color: "var(--text-primary)" }}>{r.current_value}</span>
                </p>
              )}
            </div>
            {r.drift_score != null && (
              <span className="text-[10px] font-semibold flex-shrink-0" style={{ color: "var(--text-faint)" }}>
                {Math.round(r.drift_score * 100)}%
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DriftTab({ datasetId }) {
  const { data: reports = [], isLoading } = useDrift(datasetId);
  const resetMutation = useResetBaseline(datasetId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48" style={{ color: "var(--text-muted)" }}>
        <Loader2 style={{ width: 18, height: 18 }} className="animate-spin mr-2" />
        <span className="text-sm">Loading drift reports...</span>
      </div>
    );
  }

  const grouped = reports.reduce((acc, r) => {
    (acc[r.drift_type] = acc[r.drift_type] || []).push(r);
    return acc;
  }, {});

  const highCount = reports.filter((r) => r.severity === "high").length;

  return (
    <div className="space-y-6">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Drift Monitor</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Compares current data against the baseline profile
          </p>
        </div>
        <button
          onClick={() => resetMutation.mutate()}
          disabled={resetMutation.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
          title="Set current profile as the new baseline"
        >
          {resetMutation.isPending
            ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
            : <RefreshCw style={{ width: 12, height: 12 }} />
          }
          Reset Baseline
        </button>
      </div>

      {/* Summary pills */}
      {reports.length > 0 && (
        <div className="flex items-center gap-3 flex-wrap">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
            style={{
              background: highCount > 0 ? "rgba(239,68,68,0.1)" : "var(--accent-bg)",
              border: `1px solid ${highCount > 0 ? "rgba(239,68,68,0.25)" : "var(--accent-border)"}`,
            }}
          >
            <AlertTriangle style={{ width: 12, height: 12, color: highCount > 0 ? "var(--danger)" : "var(--accent)" }} />
            <span className="text-xs font-semibold" style={{ color: highCount > 0 ? "var(--danger)" : "var(--accent)" }}>
              {reports.length} drift signal{reports.length !== 1 ? "s" : ""} · {highCount} high severity
            </span>
          </div>
        </div>
      )}

      {/* No drift */}
      {reports.length === 0 && (
        <div
          className="rounded-xl p-8 text-center"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
        >
          <div className="text-3xl mb-3">✅</div>
          <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No drift detected</p>
          <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
            The current data matches the baseline profile. Upload a new version to trigger drift analysis.
          </p>
        </div>
      )}

      {/* Grouped reports */}
      {Object.entries(grouped).map(([type, rpts]) => (
        <DriftGroup key={type} type={type} reports={rpts} />
      ))}
    </div>
  );
}

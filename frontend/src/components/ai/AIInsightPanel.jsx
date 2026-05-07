import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useAISummary } from "../../hooks/useAI";
import { cn } from "../../lib/utils";

const riskConfig = {
  low: { color: "#10b981", bg: "rgba(16,185,129,0.1)", border: "rgba(16,185,129,0.2)", label: "Low Risk" },
  medium: { color: "#f59e0b", bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", label: "Medium Risk" },
  high: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", label: "High Risk" },
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.1)", border: "rgba(220,38,38,0.25)", label: "Critical Risk" },
};

const readinessConfig = {
  ready: { icon: CheckCircle, color: "#10b981", label: "Ready to Use" },
  needs_cleaning: { icon: AlertTriangle, color: "#f59e0b", label: "Needs Cleaning" },
  not_ready: { icon: AlertTriangle, color: "#ef4444", label: "Not Ready" },
};

export default function AIInsightPanel({ datasetId }) {
  const { data, isLoading, error } = useAISummary(datasetId);
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div
        className="rounded-xl p-5 animate-fade-in"
        style={{
          background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
          border: "1px solid rgba(99,102,241,0.2)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "rgba(99,102,241,0.15)" }}
          >
            <Sparkles style={{ width: 16, height: 16, color: "#6366f1" }} className="animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <Loader2 style={{ width: 12, height: 12, color: "#6366f1" }} className="animate-spin" />
              <span className="text-xs font-medium" style={{ color: "#a5b4fc" }}>
                Generating AI Analysis...
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#475569" }}>
              Gemini is analyzing your dataset quality
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) return null;

  const risk = riskConfig[data.overall_risk] || riskConfig.medium;
  const readiness = readinessConfig[data.readiness] || readinessConfig.needs_cleaning;
  const ReadinessIcon = readiness.icon;

  return (
    <div
      className="rounded-xl overflow-hidden animate-fade-in"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))",
        border: "1px solid rgba(99,102,241,0.2)",
      }}
    >
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-4 flex items-center justify-between"
        style={{ background: "rgba(99,102,241,0.05)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Sparkles style={{ width: 15, height: 15, color: "white" }} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-white">AI Insight Analysis</span>
              {data.ai_powered ? (
                <span
                  className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
                >
                  GEMINI
                </span>
              ) : (
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded"
                  style={{ background: "rgba(100,116,139,0.2)", color: "#64748b" }}
                >
                  FALLBACK
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              Executive data quality assessment
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
            style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
          >
            <span>{risk.label}</span>
          </div>
          {expanded ? (
            <ChevronUp style={{ width: 16, height: 16, color: "#64748b" }} />
          ) : (
            <ChevronDown style={{ width: 16, height: 16, color: "#64748b" }} />
          )}
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4">
          {/* Summary */}
          <p className="text-sm leading-relaxed" style={{ color: "#cbd5e1" }}>
            {data.summary}
          </p>

          {/* Narrative (if present) */}
          {data.narrative && (
            <div
              className="rounded-lg p-3"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="text-xs leading-relaxed" style={{ color: "#94a3b8" }}>
                {data.narrative}
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Key Concerns */}
            {data.key_concerns?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle style={{ width: 13, height: 13, color: "#f59e0b" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                    Key Concerns
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.key_concerns.slice(0, 3).map((concern, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#94a3b8" }}>
                      <span className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                        style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}>
                        {i + 1}
                      </span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Recommended Actions */}
            {data.recommended_actions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp style={{ width: 13, height: 13, color: "#10b981" }} />
                  <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: "#94a3b8" }}>
                    Actions
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.recommended_actions.slice(0, 3).map((action, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "#94a3b8" }}>
                      <Zap style={{ width: 12, height: 12, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                      {action}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Readiness */}
          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
          >
            <ReadinessIcon style={{ width: 16, height: 16, color: readiness.color, flexShrink: 0 }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: readiness.color }}>
                {readiness.label}
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>
                Dataset readiness for downstream use
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Sparkles, AlertTriangle, CheckCircle, TrendingUp, Loader2, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { useAISummary } from "../../hooks/useAI";

const riskConfig = {
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.1)",  border: "rgba(16,185,129,0.2)",  label: "Low Risk" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  border: "rgba(245,158,11,0.2)",  label: "Medium Risk" },
  high:     { color: "#ef4444", bg: "rgba(239,68,68,0.1)",   border: "rgba(239,68,68,0.2)",   label: "High Risk" },
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.1)",   border: "rgba(220,38,38,0.25)",  label: "Critical Risk" },
};

const readinessConfig = {
  ready:         { icon: CheckCircle,   color: "#10b981", label: "Ready to Use" },
  needs_cleaning:{ icon: AlertTriangle, color: "#f59e0b", label: "Needs Cleaning" },
  not_ready:     { icon: AlertTriangle, color: "#ef4444", label: "Not Ready" },
};

export default function AIInsightPanel({ datasetId }) {
  const { data, isLoading, error } = useAISummary(datasetId);
  const [expanded, setExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="rounded-xl p-4 ai-panel animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--accent-bg)" }}>
            <Sparkles style={{ width: 15, height: 15, color: "var(--accent)" }} className="animate-pulse" />
          </div>
          <div className="flex items-center gap-2">
            <Loader2 style={{ width: 12, height: 12, color: "var(--accent)" }} className="animate-spin" />
            <span className="text-xs font-medium" style={{ color: "var(--accent-light)" }}>
              Generating AI Analysis with Gemini...
            </span>
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
    <div className="rounded-xl overflow-hidden animate-fade-in ai-panel">
      {/* Header */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between"
        style={{ borderBottom: expanded ? `1px solid var(--accent-border)` : "none" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Sparkles style={{ width: 14, height: 14, color: "white" }} />
          </div>
          <div className="text-left">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                AI Insight Analysis
              </span>
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={data.ai_powered
                  ? { background: "var(--accent-bg)", color: "var(--accent-light)" }
                  : { background: "var(--bg-hover)", color: "var(--text-muted)" }
                }
              >
                {data.ai_powered ? "GEMINI" : "FALLBACK"}
              </span>
            </div>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Executive data quality assessment</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}` }}
          >
            {risk.label}
          </span>
          {expanded
            ? <ChevronUp style={{ width: 15, height: 15, color: "var(--text-muted)" }} />
            : <ChevronDown style={{ width: 15, height: 15, color: "var(--text-muted)" }} />
          }
        </div>
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-4 space-y-4">
          <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>{data.summary}</p>

          {data.narrative && (
            <div className="rounded-lg p-3" style={{ background: "var(--bg-hover)", border: `1px solid var(--border)` }}>
              <p className="text-xs leading-relaxed" style={{ color: "var(--text-muted)" }}>{data.narrative}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {data.key_concerns?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle style={{ width: 12, height: 12, color: "var(--warning)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Key Concerns
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.key_concerns.slice(0, 3).map((c, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <span
                        className="w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold mt-0.5"
                        style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}
                      >{i + 1}</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {data.recommended_actions?.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp style={{ width: 12, height: 12, color: "var(--success)" }} />
                  <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                    Actions
                  </span>
                </div>
                <ul className="space-y-1.5">
                  {data.recommended_actions.slice(0, 3).map((a, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs" style={{ color: "var(--text-secondary)" }}>
                      <Zap style={{ width: 11, height: 11, color: "var(--success)", flexShrink: 0, marginTop: 1 }} />
                      {a}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: "var(--bg-hover)", border: `1px solid var(--border)` }}
          >
            <ReadinessIcon style={{ width: 15, height: 15, color: readiness.color, flexShrink: 0 }} />
            <div>
              <p className="text-xs font-semibold" style={{ color: readiness.color }}>{readiness.label}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>Dataset readiness for downstream use</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

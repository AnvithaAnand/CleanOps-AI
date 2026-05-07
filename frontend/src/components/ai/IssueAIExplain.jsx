import { useState } from "react";
import { Sparkles, ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useAIExplainIssues } from "../../hooks/useAI";

const riskColors = {
  low:      { color: "#10b981", bg: "rgba(16,185,129,0.12)" },
  medium:   { color: "#f59e0b", bg: "rgba(245,158,11,0.12)" },
  high:     { color: "#ef4444", bg: "rgba(239,68,68,0.12)" },
  critical: { color: "#dc2626", bg: "rgba(220,38,38,0.12)" },
};

export function IssueAIExplainPanel({ datasetId }) {
  const { data, isLoading } = useAIExplainIssues(datasetId);
  return { data: data?.explanations || [], isLoading };
}

export function IssueAIExplainRow({ explanation }) {
  const [open, setOpen] = useState(false);
  if (!explanation) return null;

  const risk = riskColors[explanation.risk_level] || riskColors.medium;

  return (
    <div
      className="mt-3 rounded-lg overflow-hidden"
      style={{
        background: "var(--accent-bg)",
        border: "1px solid var(--accent-border)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left"
      >
        <Sparkles style={{ width: 12, height: 12, color: "var(--accent)", flexShrink: 0 }} />
        <span style={{ color: "var(--accent-light)" }} className="font-medium">AI Analysis</span>
        <span
          className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: risk.bg, color: risk.color }}
        >
          {explanation.risk_level?.toUpperCase()}
        </span>
        {open
          ? <ChevronUp style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
          : <ChevronDown style={{ width: 12, height: 12, color: "var(--text-muted)" }} />
        }
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "var(--accent-border)" }}>
          <p className="text-xs pt-2 leading-relaxed" style={{ color: "var(--text-secondary)" }}>
            {explanation.explanation}
          </p>
          {explanation.why_it_matters && (
            <div className="flex items-start gap-2">
              <AlertTriangle style={{ width: 11, height: 11, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{explanation.why_it_matters}</p>
            </div>
          )}
          {explanation.recommendation && (
            <div className="flex items-start gap-2">
              <Zap style={{ width: 11, height: 11, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{explanation.recommendation}</p>
            </div>
          )}
          {explanation.downstream_impact && (
            <div className="flex items-start gap-2">
              <TrendingDown style={{ width: 11, height: 11, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "var(--text-secondary)" }}>{explanation.downstream_impact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Sparkles, Loader2, ChevronDown, ChevronUp, AlertTriangle, TrendingDown, Zap } from "lucide-react";
import { useAIExplainIssues } from "../../hooks/useAI";

const riskColors = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#ef4444",
  critical: "#dc2626",
};

export function IssueAIExplainPanel({ datasetId }) {
  const { data, isLoading } = useAIExplainIssues(datasetId);
  return { data: data?.explanations || [], isLoading };
}

export function IssueAIExplainRow({ explanation }) {
  const [open, setOpen] = useState(false);
  if (!explanation) return null;

  const riskColor = riskColors[explanation.risk_level] || riskColors.medium;

  return (
    <div
      className="mt-3 rounded-lg overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(139,92,246,0.03))",
        border: "1px solid rgba(99,102,241,0.15)",
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs text-left"
      >
        <Sparkles style={{ width: 12, height: 12, color: "#6366f1", flexShrink: 0 }} />
        <span style={{ color: "#a5b4fc" }} className="font-medium">AI Analysis</span>
        <span
          className="ml-auto px-1.5 py-0.5 rounded text-[10px] font-bold"
          style={{ background: `rgba(${riskColor === "#10b981" ? "16,185,129" : riskColor === "#f59e0b" ? "245,158,11" : "239,68,68"},0.15)`, color: riskColor }}
        >
          {explanation.risk_level?.toUpperCase()}
        </span>
        {open ? (
          <ChevronUp style={{ width: 12, height: 12, color: "#64748b" }} />
        ) : (
          <ChevronDown style={{ width: 12, height: 12, color: "#64748b" }} />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2 border-t" style={{ borderColor: "rgba(99,102,241,0.1)" }}>
          <p className="text-xs pt-2 leading-relaxed" style={{ color: "#94a3b8" }}>
            {explanation.explanation}
          </p>
          {explanation.why_it_matters && (
            <div className="flex items-start gap-2">
              <AlertTriangle style={{ width: 11, height: 11, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>{explanation.why_it_matters}</p>
            </div>
          )}
          {explanation.recommendation && (
            <div className="flex items-start gap-2">
              <Zap style={{ width: 11, height: 11, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>{explanation.recommendation}</p>
            </div>
          )}
          {explanation.downstream_impact && (
            <div className="flex items-start gap-2">
              <TrendingDown style={{ width: 11, height: 11, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              <p className="text-[11px]" style={{ color: "#94a3b8" }}>{explanation.downstream_impact}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, ArrowLeft, Loader2, Wrench,
  ChevronDown, ChevronUp, Sparkles, Code2,
} from "lucide-react";
import { useIssues } from "../hooks/useIssues";
import { useApplyRepairs, useDataset } from "../hooks/useDatasets";
import { useAIExplainIssues } from "../hooks/useAI";
import { IssueAIExplainRow } from "../components/ai/IssueAIExplain";
import NLCommandBar from "../components/ai/NLCommandBar";
import CodeExportModal from "../components/ai/CodeExportModal";

export default function IssuesPage() {
  const { id } = useParams();
  const { data: dataset } = useDataset(id);
  const { data: issuesData, isLoading } = useIssues(id);
  const { data: aiExplain } = useAIExplainIssues(id);
  const applyRepairs = useApplyRepairs(id);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [filter, setFilter] = useState("all");
  const [showCode, setShowCode] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "#6366f1" }} />
      </div>
    );
  }

  const issues = issuesData?.issues || [];
  const filtered =
    filter === "all" ? issues :
    filter === "open" ? issues.filter((i) => i.status === "open") :
    issues.filter((i) => i.status === "repaired");

  const aiMap = {};
  (aiExplain?.explanations || []).forEach((e) => { aiMap[e.issue_id] = e; });

  const toggleSuggestion = (sid) => {
    const next = new Set(selectedSuggestions);
    if (next.has(sid)) next.delete(sid);
    else next.add(sid);
    setSelectedSuggestions(next);
  };

  const handleApplySelected = async () => {
    if (selectedSuggestions.size === 0) return;
    try {
      await applyRepairs.mutateAsync([...selectedSuggestions]);
      setSelectedSuggestions(new Set());
    } catch (err) {
      alert("Repair failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.07)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; }}
          >
            <ArrowLeft style={{ width: 14, height: 14, color: "#94a3b8" }} />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-white">Issues & Repairs</h2>
            <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
              {dataset?.name} · {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{
              background: "rgba(99,102,241,0.1)",
              color: "#a5b4fc",
              border: "1px solid rgba(99,102,241,0.2)",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.1)"; }}
          >
            <Code2 style={{ width: 13, height: 13 }} />
            Export Code
          </button>
          {selectedSuggestions.size > 0 && (
            <button
              onClick={handleApplySelected}
              disabled={applyRepairs.isPending}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{
                background: "linear-gradient(135deg, #6366f1, #4f46e5)",
                boxShadow: "0 2px 12px rgba(99,102,241,0.35)",
              }}
            >
              {applyRepairs.isPending ? (
                <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
              ) : (
                <Wrench style={{ width: 14, height: 14 }} />
              )}
              Apply {selectedSuggestions.size} Repair{selectedSuggestions.size > 1 ? "s" : ""}
            </button>
          )}
        </div>
      </div>

      {/* NL Command Bar */}
      <NLCommandBar datasetId={id} onSuccess={() => {}} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "open", "repaired"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={
              filter === f
                ? { background: "rgba(99,102,241,0.15)", color: "#a5b4fc", border: "1px solid rgba(99,102,241,0.2)" }
                : { background: "rgba(255,255,255,0.04)", color: "#64748b", border: "1px solid rgba(255,255,255,0.06)" }
            }
          >
            {f}
            {f === "open" && (
              <span
                className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.15)", color: "#f59e0b" }}
              >
                {issues.filter((i) => i.status === "open").length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues List */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: "#111827", border: "1px solid #1e293b" }}
        >
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(16,185,129,0.1)" }}
          >
            <CheckCircle style={{ width: 20, height: 20, color: "#10b981" }} />
          </div>
          <p className="font-semibold text-white">No issues to show</p>
          <p className="text-sm mt-1" style={{ color: "#64748b" }}>
            {filter === "open" ? "All issues have been repaired!" : "Nothing here yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => {
            const isExpanded = expandedIssue === issue.id;
            const aiData = aiMap[issue.id];

            return (
              <div
                key={issue.id}
                className="rounded-xl overflow-hidden transition-all"
                style={{
                  background: "#111827",
                  border: isExpanded ? "1px solid rgba(99,102,241,0.25)" : "1px solid #1e293b",
                }}
              >
                {/* Issue Header */}
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="w-full px-5 py-4 flex items-center justify-between transition-colors text-left"
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.02)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0"
                      style={getSeverityStyle(issue.severity)}
                    >
                      {issue.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-white">{issue.description}</p>
                      <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                        {issue.issue_type} · {issue.affected_count} rows · {issue.column_name || "all columns"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {aiData && (
                      <span className="flex items-center gap-1">
                        <Sparkles style={{ width: 11, height: 11, color: "#6366f1" }} />
                      </span>
                    )}
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={
                        issue.status === "open"
                          ? { background: "rgba(245,158,11,0.12)", color: "#f59e0b" }
                          : { background: "rgba(16,185,129,0.12)", color: "#10b981" }
                      }
                    >
                      {issue.status}
                    </span>
                    {isExpanded ? (
                      <ChevronUp style={{ width: 14, height: 14, color: "#64748b" }} />
                    ) : (
                      <ChevronDown style={{ width: 14, height: 14, color: "#64748b" }} />
                    )}
                  </div>
                </button>

                {/* Expanded */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)" }}>
                    {/* AI Explanation */}
                    {aiData && <IssueAIExplainRow explanation={aiData} />}

                    {/* Repair Suggestions */}
                    {issue.repair_suggestions?.length > 0 && (
                      <div>
                        <p
                          className="text-[11px] font-semibold uppercase tracking-wider mb-2"
                          style={{ color: "#475569" }}
                        >
                          Repair Suggestions
                        </p>
                        <div className="space-y-2">
                          {issue.repair_suggestions.map((s) => {
                            const selected = selectedSuggestions.has(s.id);
                            return (
                              <label
                                key={s.id}
                                className="flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-all"
                                style={{
                                  background: selected ? "rgba(99,102,241,0.08)" : "rgba(255,255,255,0.02)",
                                  border: selected ? "1px solid rgba(99,102,241,0.3)" : "1px solid rgba(255,255,255,0.06)",
                                }}
                              >
                                <div className="relative mt-0.5 flex-shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={selected}
                                    onChange={() => toggleSuggestion(s.id)}
                                    disabled={issue.status === "repaired"}
                                    className="sr-only"
                                  />
                                  <div
                                    className="w-4 h-4 rounded flex items-center justify-center transition-all"
                                    style={{
                                      background: selected ? "#6366f1" : "rgba(255,255,255,0.06)",
                                      border: selected ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.12)",
                                    }}
                                  >
                                    {selected && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                                        <path d="M10 3L5 8.5 2 5.5" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-white">{s.description}</p>
                                    {s.is_recommended && (
                                      <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}
                                      >
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs" style={{ color: "#64748b" }}>
                                      Strategy: <span style={{ color: "#a5b4fc" }}>{s.strategy}</span>
                                    </span>
                                    <span className="text-xs" style={{ color: "#64748b" }}>
                                      Confidence:{" "}
                                      <span
                                        style={{
                                          color: s.confidence >= 0.8 ? "#10b981" : s.confidence >= 0.5 ? "#f59e0b" : "#ef4444",
                                        }}
                                      >
                                        {Math.round(s.confidence * 100)}%
                                      </span>
                                    </span>
                                  </div>
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showCode && <CodeExportModal datasetId={id} onClose={() => setShowCode(false)} />}
    </div>
  );
}

function getSeverityStyle(sev) {
  const map = {
    critical: { background: "rgba(220,38,38,0.15)", color: "#dc2626" },
    high: { background: "rgba(239,68,68,0.12)", color: "#ef4444" },
    medium: { background: "rgba(245,158,11,0.12)", color: "#f59e0b" },
    low: { background: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  };
  return map[sev] || map.medium;
}

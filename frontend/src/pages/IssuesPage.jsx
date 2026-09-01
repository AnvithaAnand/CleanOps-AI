import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle, CheckCircle, ArrowLeft, Loader2,
  Wrench, ChevronDown, ChevronUp, Sparkles, Code2, Zap,
} from "lucide-react";
import { toast } from "sonner";
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
  const [applyingAll, setApplyingAll] = useState(false);

  const issues = issuesData?.issues || [];

  // All open suggestion IDs across all issues
  const allOpenSuggestionIds = useMemo(() => {
    return issues
      .filter((i) => i.status === "open")
      .flatMap((i) => (i.repair_suggestions || []).filter((s) => s.is_recommended).map((s) => s.id));
  }, [issues]);

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
      toast.error("Repair failed: " + (err.response?.data?.detail || err.message));
    }
  };

  const handleApplyAll = async () => {
    if (allOpenSuggestionIds.length === 0) return;
    setApplyingAll(true);
    try {
      await applyRepairs.mutateAsync(allOpenSuggestionIds);
      setSelectedSuggestions(new Set());
    } catch (err) {
      toast.error("Repair failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setApplyingAll(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin" style={{ width: 24, height: 24, color: "var(--accent)" }} />
      </div>
    );
  }

  const openCount = issues.filter((i) => i.status === "open").length;

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="co-card w-8 h-8 flex items-center justify-center"
            style={{ background: "var(--bg-hover)" }}
          >
            <ArrowLeft style={{ width: 14, height: 14, color: "var(--text-secondary)" }} />
          </Link>
          <div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Issues & Repairs</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {dataset?.name} · {issues.length} issue{issues.length !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Export code */}
          <button
            onClick={() => setShowCode(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
            style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: `1px solid var(--accent-border)` }}
          >
            <Code2 style={{ width: 13, height: 13 }} />
            Export Code
          </button>

          {/* Apply All (one-click) */}
          {openCount > 0 && (
            <button
              onClick={handleApplyAll}
              disabled={applyingAll || applyRepairs.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #10b981, #059669)", boxShadow: "0 2px 10px rgba(16,185,129,0.3)" }}
              title="Apply the recommended repair for every open issue at once"
            >
              {applyingAll
                ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
                : <Zap style={{ width: 13, height: 13 }} />
              }
              Fix All ({openCount})
            </button>
          )}

          {/* Apply selected */}
          {selectedSuggestions.size > 0 && (
            <button
              onClick={handleApplySelected}
              disabled={applyRepairs.isPending}
              className="flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: "0 2px 10px rgba(99,102,241,0.3)" }}
            >
              {applyRepairs.isPending
                ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
                : <Wrench style={{ width: 14, height: 14 }} />
              }
              Apply {selectedSuggestions.size} Selected
            </button>
          )}
        </div>
      </div>

      {/* Apply All info banner */}
      {openCount > 0 && (
        <div
          className="rounded-xl px-4 py-3 flex items-center gap-3"
          style={{ background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.15)" }}
        >
          <Zap style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0 }} />
          <p className="text-xs" style={{ color: "var(--text-secondary)" }}>
            <span className="font-semibold" style={{ color: "#10b981" }}>Fix All</span>{" "}
            applies the recommended repair strategy for each open issue in one click — no need to review each one individually.
            You can also expand issues below to pick specific strategies.
          </p>
        </div>
      )}

      {/* NL Command Bar */}
      <NLCommandBar datasetId={id} />

      {/* Filters */}
      <div className="flex items-center gap-2">
        {["all", "open", "repaired"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all capitalize"
            style={
              filter === f
                ? { background: "var(--accent-bg)", color: "var(--accent-light)", border: `1px solid var(--accent-border)` }
                : { background: "var(--bg-hover)", color: "var(--text-muted)", border: `1px solid var(--border)` }
            }
          >
            {f}
            {f === "open" && openCount > 0 && (
              <span
                className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ background: "rgba(245,158,11,0.15)", color: "var(--warning)" }}
              >
                {openCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Issues list */}
      {filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-xl"
          style={{ background: "var(--bg-card)", border: `1px solid var(--border)` }}
        >
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3"
            style={{ background: "rgba(16,185,129,0.1)" }}>
            <CheckCircle style={{ width: 20, height: 20, color: "#10b981" }} />
          </div>
          <p className="font-semibold" style={{ color: "var(--text-primary)" }}>No issues to show</p>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
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
                  background: "var(--bg-card)",
                  border: `1px solid ${isExpanded ? "var(--accent-border)" : "var(--border)"}`,
                }}
              >
                <button
                  onClick={() => setExpandedIssue(isExpanded ? null : issue.id)}
                  className="table-row-hover w-full px-5 py-4 flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="px-2 py-0.5 rounded text-[10px] font-bold uppercase flex-shrink-0"
                      style={getSeverityStyle(issue.severity)}
                    >
                      {issue.severity}
                    </span>
                    <div>
                      <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                        {issue.description}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {issue.issue_type} · {issue.affected_count} rows · {issue.column_name || "all columns"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {aiData && <Sparkles style={{ width: 11, height: 11, color: "var(--accent)" }} />}
                    <span
                      className="text-[10px] font-medium px-2 py-0.5 rounded-full"
                      style={
                        issue.status === "open"
                          ? { background: "rgba(245,158,11,0.12)", color: "var(--warning)" }
                          : { background: "rgba(16,185,129,0.12)", color: "var(--success)" }
                      }
                    >
                      {issue.status}
                    </span>
                    {isExpanded
                      ? <ChevronUp style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                      : <ChevronDown style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
                    }
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-5 pt-2 space-y-3" style={{ borderTop: `1px solid var(--border)` }}>
                    {aiData && <IssueAIExplainRow explanation={aiData} />}

                    {issue.repair_suggestions?.length > 0 && (
                      <div>
                        <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "var(--text-faint)" }}>
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
                                  background: selected ? "var(--accent-bg)" : "var(--bg-hover)",
                                  border: `1px solid ${selected ? "var(--accent-border)" : "var(--border)"}`,
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
                                      background: selected ? "var(--accent)" : "var(--bg-hover)",
                                      border: `1px solid ${selected ? "var(--accent)" : "var(--border-strong)"}`,
                                    }}
                                  >
                                    {selected && (
                                      <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 12 12">
                                        <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                                      {s.description}
                                    </p>
                                    {s.is_recommended && (
                                      <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0"
                                        style={{ background: "rgba(16,185,129,0.12)", color: "var(--success)" }}
                                      >
                                        Recommended
                                      </span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                      Strategy: <span style={{ color: "var(--accent-light)" }}>{s.strategy}</span>
                                    </span>
                                    <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                                      Confidence:{" "}
                                      <span style={{ color: s.confidence >= 0.8 ? "var(--success)" : s.confidence >= 0.5 ? "var(--warning)" : "var(--danger)" }}>
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
    critical: { background: "rgba(220,38,38,0.15)",   color: "#dc2626" },
    high:     { background: "rgba(239,68,68,0.12)",   color: "#ef4444" },
    medium:   { background: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
    low:      { background: "rgba(100,116,139,0.12)", color: "#94a3b8" },
  };
  return map[sev] || map.medium;
}

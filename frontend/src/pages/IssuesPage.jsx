import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  AlertTriangle,
  CheckCircle,
  ArrowLeft,
  Loader2,
  Wrench,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useIssues } from "../hooks/useIssues";
import { useApplyRepairs, useDataset } from "../hooks/useDatasets";
import { cn, getSeverityColor } from "../lib/utils";

export default function IssuesPage() {
  const { id } = useParams();
  const { data: dataset } = useDataset(id);
  const { data: issuesData, isLoading } = useIssues(id);
  const applyRepairs = useApplyRepairs(id);
  const [expandedIssue, setExpandedIssue] = useState(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState(new Set());
  const [filter, setFilter] = useState("all");

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const issues = issuesData?.issues || [];
  const filtered =
    filter === "all"
      ? issues
      : filter === "open"
      ? issues.filter((i) => i.status === "open")
      : issues.filter((i) => i.status === "repaired");

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to={`/dataset/${id}`}
            className="p-2 rounded-lg hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-semibold">Issues & Repairs</h2>
            <p className="text-sm text-muted-foreground">
              {dataset?.name} — {issues.length} issues
            </p>
          </div>
        </div>
        {selectedSuggestions.size > 0 && (
          <button
            onClick={handleApplySelected}
            disabled={applyRepairs.isPending}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {applyRepairs.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Wrench className="w-4 h-4" />
            )}
            Apply {selectedSuggestions.size} Repair
            {selectedSuggestions.size > 1 ? "s" : ""}
          </button>
        )}
      </div>

      <div className="flex gap-2">
        {["all", "open", "repaired"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
              filter === f
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-10 bg-card border border-border rounded-xl">
          <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-3" />
          <p className="font-medium">No issues to show</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((issue) => (
            <div
              key={issue.id}
              className="bg-card border border-border rounded-xl overflow-hidden"
            >
              <button
                onClick={() =>
                  setExpandedIssue(
                    expandedIssue === issue.id ? null : issue.id
                  )
                }
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-3 text-left">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium uppercase",
                      getSeverityColor(issue.severity)
                    )}
                  >
                    {issue.severity}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{issue.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {issue.issue_type} • {issue.affected_count} rows •{" "}
                      {issue.column_name || "all columns"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs",
                      issue.status === "open"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-green-100 text-green-700"
                    )}
                  >
                    {issue.status}
                  </span>
                  {expandedIssue === issue.id ? (
                    <ChevronUp className="w-4 h-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  )}
                </div>
              </button>

              {expandedIssue === issue.id &&
                issue.repair_suggestions?.length > 0 && (
                  <div className="px-5 pb-4 border-t border-border/50 pt-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">
                      Repair Suggestions:
                    </p>
                    {issue.repair_suggestions.map((s) => (
                      <label
                        key={s.id}
                        className={cn(
                          "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors",
                          selectedSuggestions.has(s.id)
                            ? "border-primary bg-primary/5"
                            : "border-border hover:bg-muted/30"
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedSuggestions.has(s.id)}
                          onChange={() => toggleSuggestion(s.id)}
                          disabled={issue.status === "repaired"}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{s.description}</p>
                          <p className="text-xs text-muted-foreground">
                            Strategy: {s.strategy} • Confidence:{" "}
                            {Math.round(s.confidence * 100)}%
                            {s.is_recommended && (
                              <span className="ml-2 text-green-600 font-medium">
                                Recommended
                              </span>
                            )}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState } from "react";
import { Sparkles, Send, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { useNLCommand } from "../../hooks/useAI";
import { useApplyRepairs } from "../../hooks/useDatasets";

const EXAMPLES = [
  "Fill missing age values with median",
  "Remove duplicate rows",
  "Replace missing email with unknown",
  "Drop rows with null revenue",
];

export default function NLCommandBar({ datasetId, onSuccess }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const nlCommand = useNLCommand(datasetId);
  const applyRepairs = useApplyRepairs(datasetId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || nlCommand.isPending) return;
    setResult(null);
    try {
      const res = await nlCommand.mutateAsync(input.trim());
      setResult(res);
    } catch {
      setResult({ understood: false, message: "Failed to process command. Please try again." });
    }
  };

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: "linear-gradient(135deg, rgba(99,102,241,0.06), rgba(6,182,212,0.03))",
        border: "1px solid rgba(99,102,241,0.15)",
      }}
    >
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}
      >
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Sparkles style={{ width: 12, height: 12, color: "white" }} />
        </div>
        <span className="text-xs font-semibold text-white">Natural Language Cleaning</span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto"
          style={{ background: "rgba(99,102,241,0.2)", color: "#a5b4fc" }}
        >
          AI
        </span>
      </div>

      <div className="p-4">
        {/* Input */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "Fill missing age with median"'
            className="flex-1 text-sm rounded-lg px-4 py-2.5 outline-none transition-all"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              color: "#e2e8f0",
              caretColor: "#6366f1",
            }}
            onFocus={(e) => { e.target.style.borderColor = "rgba(99,102,241,0.5)"; }}
            onBlur={(e) => { e.target.style.borderColor = "rgba(255,255,255,0.08)"; }}
          />
          <button
            type="submit"
            disabled={!input.trim() || nlCommand.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
            }}
          >
            {nlCommand.isPending ? (
              <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
            ) : (
              <Send style={{ width: 14, height: 14 }} />
            )}
            Parse
          </button>
        </form>

        {/* Examples */}
        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="text-[11px] px-2 py-1 rounded-md transition-all"
              style={{
                background: "rgba(255,255,255,0.04)",
                color: "#64748b",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "#94a3b8"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "#64748b"; }}
            >
              {ex}
            </button>
          ))}
        </div>

        {/* Result */}
        {result && (
          <div
            className="mt-3 rounded-lg p-3 animate-fade-in"
            style={{
              background: result.understood
                ? "rgba(16,185,129,0.08)"
                : "rgba(239,68,68,0.08)",
              border: `1px solid ${result.understood ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            <div className="flex items-start gap-2">
              {result.understood ? (
                <CheckCircle style={{ width: 14, height: 14, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
              ) : (
                <AlertCircle style={{ width: 14, height: 14, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              )}
              <div className="flex-1">
                <p className="text-xs font-medium" style={{ color: result.understood ? "#10b981" : "#ef4444" }}>
                  {result.understood ? "Command understood" : "Could not understand"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{result.message}</p>
                {result.understood && result.action && (
                  <div className="mt-1.5 flex flex-wrap gap-2 text-[11px]">
                    <span style={{ color: "#64748b" }}>Action: <span style={{ color: "#a5b4fc" }}>{result.action}</span></span>
                    {result.column && <span style={{ color: "#64748b" }}>Column: <span style={{ color: "#a5b4fc" }}>{result.column}</span></span>}
                    {result.confidence && (
                      <span style={{ color: "#64748b" }}>
                        Confidence: <span style={{ color: "#10b981" }}>{Math.round(result.confidence * 100)}%</span>
                      </span>
                    )}
                  </div>
                )}
              </div>
              {result.understood && (
                <button
                  onClick={() => {
                    setResult(null);
                    setInput("");
                    onSuccess?.();
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium ml-auto flex-shrink-0 transition-all"
                  style={{
                    background: "rgba(16,185,129,0.15)",
                    color: "#10b981",
                    border: "1px solid rgba(16,185,129,0.2)",
                  }}
                >
                  <Zap style={{ width: 10, height: 10 }} />
                  Go to Repairs
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

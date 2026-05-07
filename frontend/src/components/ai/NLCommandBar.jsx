import { useState } from "react";
import { Sparkles, Send, Loader2, CheckCircle, AlertCircle, Zap } from "lucide-react";
import { useNLCommand } from "../../hooks/useAI";

const EXAMPLES = [
  "Fill missing age values with median",
  "Remove duplicate rows",
  "Replace missing email with unknown",
  "Drop rows with null revenue",
];

export default function NLCommandBar({ datasetId }) {
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const nlCommand = useNLCommand(datasetId);

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
    <div className="rounded-xl overflow-hidden ai-panel">
      <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: `1px solid var(--accent-border)` }}>
        <div
          className="w-6 h-6 rounded-md flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
        >
          <Sparkles style={{ width: 11, height: 11, color: "white" }} />
        </div>
        <span className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
          Natural Language Cleaning
        </span>
        <span
          className="text-[10px] font-bold px-1.5 py-0.5 rounded ml-auto"
          style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}
        >
          AI
        </span>
      </div>

      <div className="p-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='e.g. "Fill missing age with median"'
            className="flex-1 text-sm rounded-lg px-4 py-2.5 outline-none transition-all"
            style={{
              background: "var(--bg-hover)",
              border: `1px solid var(--border)`,
              color: "var(--text-primary)",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
          <button
            type="submit"
            disabled={!input.trim() || nlCommand.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white transition-all disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)" }}
          >
            {nlCommand.isPending
              ? <Loader2 style={{ width: 13, height: 13 }} className="animate-spin" />
              : <Send style={{ width: 13, height: 13 }} />
            }
            Parse
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 mt-2.5">
          {EXAMPLES.map((ex) => (
            <button
              key={ex}
              onClick={() => setInput(ex)}
              className="text-[11px] px-2 py-1 rounded-md transition-all"
              style={{ background: "var(--bg-hover)", color: "var(--text-muted)", border: `1px solid var(--border)` }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
            >
              {ex}
            </button>
          ))}
        </div>

        {result && (
          <div
            className="mt-3 rounded-lg p-3 animate-fade-in"
            style={{
              background: result.understood ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
              border: `1px solid ${result.understood ? "rgba(16,185,129,0.2)" : "rgba(239,68,68,0.2)"}`,
            }}
          >
            <div className="flex items-start gap-2">
              {result.understood
                ? <CheckCircle style={{ width: 13, height: 13, color: "#10b981", flexShrink: 0, marginTop: 1 }} />
                : <AlertCircle style={{ width: 13, height: 13, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
              }
              <div className="flex-1">
                <p className="text-xs font-semibold" style={{ color: result.understood ? "#10b981" : "#ef4444" }}>
                  {result.understood ? "Command understood" : "Could not understand"}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-secondary)" }}>{result.message}</p>
                {result.understood && (
                  <div className="flex flex-wrap gap-3 mt-1.5 text-[11px]">
                    {result.action && <span style={{ color: "var(--text-muted)" }}>Action: <span style={{ color: "var(--accent-light)" }}>{result.action}</span></span>}
                    {result.column && <span style={{ color: "var(--text-muted)" }}>Column: <span style={{ color: "var(--accent-light)" }}>{result.column}</span></span>}
                    {result.confidence && <span style={{ color: "var(--text-muted)" }}>Confidence: <span style={{ color: "#10b981" }}>{Math.round(result.confidence * 100)}%</span></span>}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

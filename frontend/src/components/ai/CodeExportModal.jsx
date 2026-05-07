import { useState } from "react";
import { X, Code2, Copy, Check, Download, Sparkles } from "lucide-react";
import { useCleaningCode } from "../../hooks/useAI";

export default function CodeExportModal({ datasetId, onClose }) {
  const [copied, setCopied] = useState(false);
  const { data, isLoading } = useCleaningCode(datasetId, true);

  const handleCopy = () => {
    if (!data?.pandas_code) return;
    navigator.clipboard.writeText(data.pandas_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!data?.pandas_code) return;
    const blob = new Blob([data.pandas_code], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cleaning_script.py";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-2xl rounded-2xl overflow-hidden animate-fade-in"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--border-strong)",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5)",
          maxHeight: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Accent bar */}
        <div className="h-0.5 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />

        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
            >
              <Code2 style={{ width: 15, height: 15, color: "white" }} />
            </div>
            <div>
              <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Export Cleaning Code</h3>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {data?.ai_powered ? "AI-generated pandas script" : "Rule-based pandas script"}
              </p>
            </div>
            {data?.ai_powered && (
              <span
                className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}
              >
                GEMINI
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}
            onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
          >
            <X style={{ width: 14, height: 14, color: "var(--text-muted)" }} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center"
                style={{ background: "var(--accent-bg)" }}
              >
                <Sparkles style={{ width: 20, height: 20, color: "var(--accent)" }} className="animate-pulse" />
              </div>
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Generating cleaning script...</p>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>Gemini is writing production-ready pandas code</p>
            </div>
          ) : data ? (
            <>
              {data.explanation && (
                <div
                  className="rounded-lg p-3"
                  style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
                >
                  <p className="text-xs" style={{ color: "var(--accent-light)" }}>{data.explanation}</p>
                </div>
              )}
              <div
                className="rounded-xl overflow-hidden"
                style={{ border: "1px solid var(--border-strong)" }}
              >
                <div
                  className="flex items-center justify-between px-4 py-2.5"
                  style={{ background: "var(--bg)", borderBottom: "1px solid var(--border)" }}
                >
                  <span className="text-xs font-mono font-medium" style={{ color: "var(--text-muted)" }}>cleaning_script.py</span>
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: copied ? "rgba(16,185,129,0.12)" : "var(--bg-hover)",
                        color: copied ? "#10b981" : "var(--text-secondary)",
                        border: `1px solid ${copied ? "rgba(16,185,129,0.2)" : "var(--border)"}`,
                      }}
                    >
                      {copied ? <Check style={{ width: 12, height: 12 }} /> : <Copy style={{ width: 12, height: 12 }} />}
                      {copied ? "Copied!" : "Copy"}
                    </button>
                    <button
                      onClick={handleDownload}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all"
                      style={{
                        background: "var(--accent-bg)",
                        color: "var(--accent-light)",
                        border: "1px solid var(--accent-border)",
                      }}
                    >
                      <Download style={{ width: 12, height: 12 }} />
                      Download
                    </button>
                  </div>
                </div>
                {/* Code is always dark for readability — intentional exception */}
                <pre
                  className="p-4 text-xs overflow-x-auto"
                  style={{
                    fontFamily: "'JetBrains Mono', 'Fira Code', 'Consolas', monospace",
                    color: "#a5b4fc",
                    background: "#0a0f1e",
                    maxHeight: "400px",
                    lineHeight: 1.8,
                  }}
                >
                  <code>{data.pandas_code}</code>
                </pre>
              </div>
            </>
          ) : (
            <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
              No cleaning code available yet. Apply repairs first.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileUp, X, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useUploadDataset } from "../hooks/useDatasets";
import { formatBytes } from "../lib/utils";

const FEATURES = [
  { icon: "🔍", title: "Automatic Profiling",  desc: "Column types, stats, distributions, PII detection" },
  { icon: "⚠️", title: "Issue Detection",       desc: "Nulls, outliers, duplicates, type mismatches" },
  { icon: "🤖", title: "AI Analysis",           desc: "Gemini-powered explanations and risk assessment" },
  { icon: "🔧", title: "Smart Repairs",         desc: "One-click fixes or Fix All with full audit trail" },
];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const upload = useUploadDataset();

  const validateAndSet = (f) => {
    const validExts = [".csv", ".xlsx", ".xls", ".parquet", ".pq"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) { alert("Unsupported file type."); return; }
    if (f.size > 50 * 1024 * 1024) { alert("File exceeds 50MB limit."); return; }
    setFile(f);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files[0]) validateAndSet(e.dataTransfer.files[0]);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    const formData = new FormData();
    formData.append("file", file);
    try {
      const result = await upload.mutateAsync(formData);
      navigate(`/dataset/${result.id}`);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: `1px solid var(--border)` }}
      >
        {/* Accent bar */}
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />

        <div className="p-8">
          <div className="text-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}
            >
              <FileUp style={{ width: 24, height: 24, color: "var(--accent)" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Upload Dataset</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>CSV, Excel, or Parquet · up to 50MB</p>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById("file-input").click()}
            className="rounded-xl p-10 text-center transition-all cursor-pointer select-none"
            style={{
              border: dragging ? `2px dashed var(--accent)` : file ? `2px solid var(--accent-border)` : `2px dashed var(--border)`,
              background: dragging ? "var(--accent-bg)" : "var(--bg-hover)",
            }}
          >
            <input id="file-input" type="file" accept=".csv,.xlsx,.xls,.parquet,.pq" className="hidden"
              onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }} />

            {file ? (
              <div className="flex items-center justify-center gap-4">
                <CheckCircle style={{ width: 32, height: 32, color: "var(--success)" }} />
                <div className="text-left">
                  <p className="font-semibold" style={{ color: "var(--text-primary)" }}>{file.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <>
                <Upload style={{ width: 32, height: 32, color: dragging ? "var(--accent)" : "var(--text-faint)" }}
                  className="mx-auto mb-3 transition-colors" />
                <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>
                  {dragging ? "Drop it here!" : "Drag and drop your file here"}
                </p>
                <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>or click to browse files</p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  {["CSV", "XLSX", "PARQUET"].map((fmt) => (
                    <span key={fmt} className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
                      {fmt}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleUpload}
            disabled={!file || upload.isPending}
            className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: file ? "0 4px 18px rgba(99,102,241,0.3)" : "none" }}
          >
            {upload.isPending
              ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Uploading & Analyzing...</>
              : <><Sparkles style={{ width: 15, height: 15 }} /> Upload & Analyze with AI</>
            }
          </button>
        </div>
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon, title, desc }) => (
          <div key={title} className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "var(--bg-card)", border: `1px solid var(--border)` }}>
            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>{title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

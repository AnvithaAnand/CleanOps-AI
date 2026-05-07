import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileUp, X, Loader2, CheckCircle, Sparkles } from "lucide-react";
import { useUploadDataset } from "../hooks/useDatasets";
import { formatBytes } from "../lib/utils";

const FEATURES = [
  { icon: "🔍", title: "Automatic Profiling", desc: "Column types, stats, distributions, PII detection" },
  { icon: "⚠️", title: "Issue Detection", desc: "Nulls, outliers, duplicates, type mismatches" },
  { icon: "🤖", title: "AI Analysis", desc: "Gemini-powered explanations and risk assessment" },
  { icon: "🔧", title: "Smart Repairs", desc: "One-click fixes with full audit trail" },
];

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const navigate = useNavigate();
  const upload = useUploadDataset();

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files[0];
    if (dropped) validateAndSet(dropped);
  }, []);

  const validateAndSet = (f) => {
    const validExts = [".csv", ".xlsx", ".xls", ".parquet", ".pq"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) {
      alert("Unsupported file type. Please upload CSV, Excel, or Parquet files.");
      return;
    }
    if (f.size > 50 * 1024 * 1024) {
      alert("File exceeds 50MB limit.");
      return;
    }
    setFile(f);
  };

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
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
      {/* Upload Card */}
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "#111827", border: "1px solid #1e293b" }}
      >
        {/* Top accent bar */}
        <div
          className="h-1 w-full"
          style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }}
        />

        <div className="p-8">
          <div className="text-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(99,102,241,0.1)", border: "1px solid rgba(99,102,241,0.2)" }}
            >
              <FileUp style={{ width: 24, height: 24, color: "#6366f1" }} />
            </div>
            <h2 className="text-xl font-bold text-white">Upload Dataset</h2>
            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
              CSV, Excel, or Parquet files up to 50MB
            </p>
          </div>

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => !file && document.getElementById("file-input").click()}
            className="rounded-xl p-10 text-center transition-all cursor-pointer select-none"
            style={{
              border: dragging
                ? "2px dashed #6366f1"
                : file
                ? "2px solid rgba(99,102,241,0.3)"
                : "2px dashed #1e293b",
              background: dragging
                ? "rgba(99,102,241,0.05)"
                : file
                ? "rgba(99,102,241,0.03)"
                : "rgba(255,255,255,0.01)",
            }}
            onMouseEnter={(e) => {
              if (!file && !dragging) e.currentTarget.style.borderColor = "#334155";
            }}
            onMouseLeave={(e) => {
              if (!file && !dragging) e.currentTarget.style.borderColor = "#1e293b";
            }}
          >
            <input
              id="file-input"
              type="file"
              accept=".csv,.xlsx,.xls,.parquet,.pq"
              className="hidden"
              onChange={(e) => { if (e.target.files[0]) validateAndSet(e.target.files[0]); }}
            />
            {file ? (
              <div className="flex items-center justify-center gap-4">
                <CheckCircle style={{ width: 32, height: 32, color: "#10b981" }} />
                <div className="text-left">
                  <p className="font-semibold text-white">{file.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>{formatBytes(file.size)}</p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); setFile(null); }}
                  className="ml-2 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                  style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444" }}
                >
                  <X style={{ width: 14, height: 14 }} />
                </button>
              </div>
            ) : (
              <>
                <Upload
                  style={{ width: 36, height: 36, color: dragging ? "#6366f1" : "#475569" }}
                  className="mx-auto mb-3 transition-colors"
                />
                <p className="text-sm font-medium text-white mb-1">
                  {dragging ? "Drop it here!" : "Drag and drop your file here"}
                </p>
                <p className="text-xs" style={{ color: "#64748b" }}>or click to browse files</p>
                <div className="flex items-center justify-center gap-3 mt-4">
                  {["CSV", "XLSX", "PARQUET"].map((fmt) => (
                    <span
                      key={fmt}
                      className="text-[10px] font-bold px-2 py-0.5 rounded"
                      style={{ background: "rgba(99,102,241,0.1)", color: "#6366f1" }}
                    >
                      {fmt}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={!file || upload.isPending}
            className="mt-5 w-full py-3 rounded-xl text-sm font-semibold text-white transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              boxShadow: file ? "0 4px 20px rgba(99,102,241,0.35)" : "none",
            }}
            onMouseEnter={(e) => { if (file) e.currentTarget.style.boxShadow = "0 6px 25px rgba(99,102,241,0.5)"; }}
            onMouseLeave={(e) => { if (file) e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.35)"; }}
          >
            {upload.isPending ? (
              <>
                <Loader2 style={{ width: 16, height: 16 }} className="animate-spin" />
                Uploading & Analyzing...
              </>
            ) : (
              <>
                <Sparkles style={{ width: 15, height: 15 }} />
                Upload & Analyze with AI
              </>
            )}
          </button>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="grid grid-cols-2 gap-3">
        {FEATURES.map(({ icon, title, desc }) => (
          <div
            key={title}
            className="rounded-xl p-4 flex items-start gap-3"
            style={{ background: "#111827", border: "1px solid #1e293b" }}
          >
            <span className="text-lg flex-shrink-0 mt-0.5">{icon}</span>
            <div>
              <p className="text-xs font-semibold text-white">{title}</p>
              <p className="text-[11px] mt-0.5" style={{ color: "#64748b" }}>{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

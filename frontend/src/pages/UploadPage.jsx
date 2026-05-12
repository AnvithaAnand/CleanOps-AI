import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Upload, FileUp, X, Loader2, CheckCircle, Sparkles, Link2, Sheet, Database } from "lucide-react";
import { useUploadDataset } from "../hooks/useDatasets";
import { importFromUrl, importFromGoogleSheets, importFromPostgresql } from "../api/datasets";
import { formatBytes } from "../lib/utils";

const FEATURES = [
  { icon: "🔍", title: "Automatic Profiling",  desc: "Column types, stats, distributions, PII detection" },
  { icon: "⚠️", title: "Issue Detection",       desc: "Nulls, outliers, duplicates, type mismatches" },
  { icon: "🤖", title: "AI Analysis",           desc: "Gemini-powered explanations and risk assessment" },
  { icon: "🔧", title: "Smart Repairs",         desc: "One-click fixes or Fix All with full audit trail" },
];

const TABS = [
  { id: "file",    label: "File Upload",    Icon: FileUp },
  { id: "url",     label: "From URL",       Icon: Link2 },
  { id: "sheets",  label: "Google Sheets",  Icon: Sheet },
  { id: "postgres", label: "PostgreSQL",    Icon: Database },
];

function TabBar({ active, onChange }) {
  return (
    <div className="flex gap-1 p-1 rounded-xl mb-6" style={{ background: "var(--bg-hover)" }}>
      {TABS.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onChange(id)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium transition-all"
            style={{
              background: isActive ? "var(--bg-card)" : "transparent",
              color: isActive ? "var(--accent)" : "var(--text-muted)",
              border: isActive ? "1px solid var(--border)" : "1px solid transparent",
              boxShadow: isActive ? "0 1px 4px rgba(0,0,0,0.15)" : "none",
            }}
          >
            <Icon style={{ width: 12, height: 12 }} />
            {label}
          </button>
        );
      })}
    </div>
  );
}

function FileTab({ onSuccess }) {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const upload = useUploadDataset();

  const validateAndSet = (f) => {
    const validExts = [".csv", ".xlsx", ".xls", ".parquet", ".pq"];
    const ext = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    if (!validExts.includes(ext)) { alert("Unsupported file type."); return; }
    if (f.size > 200 * 1024 * 1024) { alert("File exceeds 200MB limit."); return; }
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
      onSuccess(result.id);
    } catch (err) {
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <>
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
            <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>or click to browse · up to 200MB</p>
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
    </>
  );
}

function UrlTab({ onSuccess }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await importFromUrl({ url: url.trim(), name: name.trim() || undefined });
      onSuccess(res.data.id);
    } catch (err) {
      alert("Import failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
          File URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/data.csv"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
        <p className="text-[11px] mt-1" style={{ color: "var(--text-faint)" }}>
          Must be a publicly accessible CSV, Excel, or Parquet file
        </p>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
          Dataset name (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Dataset"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>
      <button
        onClick={handleImport}
        disabled={!url.trim() || loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: url ? "0 4px 18px rgba(99,102,241,0.3)" : "none" }}
      >
        {loading ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Importing...</> : <><Link2 style={{ width: 15, height: 15 }} /> Import from URL</>}
      </button>
    </div>
  );
}

function SheetsTab({ onSuccess }) {
  const [url, setUrl] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImport = async () => {
    if (!url.trim()) return;
    setLoading(true);
    try {
      const res = await importFromGoogleSheets({ url: url.trim(), name: name.trim() || undefined });
      onSuccess(res.data.id);
    } catch (err) {
      alert("Import failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div
        className="flex items-start gap-3 px-4 py-3 rounded-xl text-xs"
        style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)", color: "var(--accent-light)" }}
      >
        <Sheet style={{ width: 14, height: 14, marginTop: 1, flexShrink: 0 }} />
        <span>The sheet must be shared as <strong>"Anyone with the link can view"</strong>. Tabs default to the first sheet; add <code>#gid=...</code> to import a specific tab.</span>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
          Google Sheets URL
        </label>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
          Dataset name (optional)
        </label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Sheet"
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none"
          style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
        />
      </div>
      <button
        onClick={handleImport}
        disabled={!url.trim() || loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: url ? "0 4px 18px rgba(99,102,241,0.3)" : "none" }}
      >
        {loading ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Importing...</> : <><Sheet style={{ width: 15, height: 15 }} /> Import from Google Sheets</>}
      </button>
    </div>
  );
}

function PostgresTab({ onSuccess }) {
  const [form, setForm] = useState({ host: "", port: "5432", database: "", username: "", password: "", query: "SELECT * FROM table_name LIMIT 10000", name: "" });
  const [loading, setLoading] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleImport = async () => {
    if (!form.host || !form.database || !form.query) return;
    setLoading(true);
    try {
      const res = await importFromPostgresql({
        host: form.host, port: parseInt(form.port) || 5432,
        database: form.database, username: form.username,
        password: form.password, query: form.query,
        name: form.name || undefined,
      });
      onSuccess(res.data.id);
    } catch (err) {
      alert("Import failed: " + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fieldStyle = { background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const labelStyle = { color: "var(--text-muted)" };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Host</label>
          <input value={form.host} onChange={set("host")} placeholder="db.example.com" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Port</label>
          <input value={form.port} onChange={set("port")} placeholder="5432" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Database</label>
        <input value={form.database} onChange={set("database")} placeholder="mydb" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Username</label>
          <input value={form.username} onChange={set("username")} placeholder="postgres" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Password</label>
          <input type="password" value={form.password} onChange={set("password")} placeholder="••••••••" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={labelStyle}>SQL Query</label>
        <textarea
          value={form.query} onChange={set("query")} rows={3}
          className="w-full px-3 py-2.5 rounded-lg text-sm outline-none font-mono resize-none"
          style={fieldStyle}
        />
      </div>
      <div>
        <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Dataset name (optional)</label>
        <input value={form.name} onChange={set("name")} placeholder="Query Result" className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
      </div>
      <button
        onClick={handleImport}
        disabled={!form.host || !form.database || !form.query || loading}
        className="w-full py-3 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)", boxShadow: form.host ? "0 4px 18px rgba(99,102,241,0.3)" : "none" }}
      >
        {loading ? <><Loader2 style={{ width: 16, height: 16 }} className="animate-spin" /> Importing...</> : <><Database style={{ width: 15, height: 15 }} /> Import from PostgreSQL</>}
      </button>
    </div>
  );
}

export default function UploadPage() {
  const [tab, setTab] = useState("file");
  const navigate = useNavigate();

  const handleSuccess = (id) => navigate(`/dataset/${id}`);

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div
        className="rounded-2xl overflow-hidden"
        style={{ background: "var(--bg-card)", border: `1px solid var(--border)` }}
      >
        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, #06b6d4)" }} />

        <div className="p-8">
          <div className="text-center mb-7">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}
            >
              <FileUp style={{ width: 24, height: 24, color: "var(--accent)" }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: "var(--text-primary)" }}>Add Dataset</h2>
            <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>Upload a file or connect to a data source</p>
          </div>

          <TabBar active={tab} onChange={setTab} />

          {tab === "file"     && <FileTab onSuccess={handleSuccess} />}
          {tab === "url"      && <UrlTab onSuccess={handleSuccess} />}
          {tab === "sheets"   && <SheetsTab onSuccess={handleSuccess} />}
          {tab === "postgres" && <PostgresTab onSuccess={handleSuccess} />}
        </div>
      </div>

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

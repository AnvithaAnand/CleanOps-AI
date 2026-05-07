import { useLocation, Link, useParams } from "react-router-dom";
import { Upload, Bell, Search, Sparkles } from "lucide-react";
import { useDataset } from "../../hooks/useDatasets";

function DatasetHeader({ id }) {
  const { data: dataset } = useDataset(id);
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: "#64748b" }}>Dataset Explorer</p>
      <h2 className="text-base font-semibold text-white leading-tight truncate max-w-xs">
        {dataset?.name || "Loading..."}
      </h2>
    </div>
  );
}

const staticTitles = {
  "/": { title: "Dashboard", sub: "Overview of your data reliability" },
  "/upload": { title: "Upload Dataset", sub: "Import CSV, XLSX, or Parquet files" },
  "/rules": { title: "Quality Rules", sub: "Define and manage validation rules" },
};

export default function Header() {
  const { pathname } = useLocation();
  const params = useParams();
  const isDatasetRoute = pathname.startsWith("/dataset/");
  const info = staticTitles[pathname];

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: "rgba(10,15,30,0.95)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(12px)",
      }}
    >
      <div className="flex items-center gap-3">
        {isDatasetRoute && params.id ? (
          <DatasetHeader id={params.id} />
        ) : info ? (
          <div>
            <h2 className="text-base font-semibold text-white">{info.title}</h2>
            <p className="text-xs" style={{ color: "#64748b" }}>{info.sub}</p>
          </div>
        ) : (
          <h2 className="text-base font-semibold text-white">CleanOps AI</h2>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
          style={{
            background: "rgba(255,255,255,0.04)",
            color: "#64748b",
            border: "1px solid rgba(255,255,255,0.06)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.07)";
            e.currentTarget.style.color = "#94a3b8";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255,255,255,0.04)";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <Search style={{ width: 14, height: 14 }} />
          <span>Search</span>
          <kbd
            className="ml-2 text-[10px] px-1 py-0.5 rounded"
            style={{ background: "rgba(255,255,255,0.08)", color: "#475569" }}
          >
            ⌘K
          </kbd>
        </button>

        <button
          className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.06)" }}
        >
          <Bell style={{ width: 14, height: 14, color: "#64748b" }} />
        </button>

        <Link
          to="/upload"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, #6366f1, #4f46e5)",
            boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.boxShadow = "0 4px 20px rgba(99,102,241,0.5)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.boxShadow = "0 2px 12px rgba(99,102,241,0.3)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <Upload style={{ width: 13, height: 13 }} />
          Upload
        </Link>
      </div>
    </header>
  );
}

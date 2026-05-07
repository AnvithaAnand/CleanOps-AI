import { useLocation, Link, useParams } from "react-router-dom";
import { Upload, Moon, Sun, Bell } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDataset } from "../../hooks/useDatasets";

function DatasetBreadcrumb({ id }) {
  const { data: dataset } = useDataset(id);
  return (
    <div>
      <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
        Dataset Explorer
      </p>
      <h2 className="text-base font-semibold leading-tight truncate max-w-xs" style={{ color: "var(--text-primary)" }}>
        {dataset?.name || "Loading..."}
      </h2>
    </div>
  );
}

const staticTitles = {
  "/":       { title: "Dashboard",       sub: "Overview of your data reliability" },
  "/upload": { title: "Upload Dataset",  sub: "Import CSV, XLSX, or Parquet files" },
  "/rules":  { title: "Quality Rules",   sub: "Define and manage validation rules" },
};

export default function Header() {
  const { pathname } = useLocation();
  const params = useParams();
  const { theme, toggle } = useTheme();
  const isDatasetRoute = pathname.startsWith("/dataset/");
  const info = staticTitles[pathname];
  const isDark = theme === "dark";

  return (
    <header
      className="h-16 flex items-center justify-between px-6 flex-shrink-0"
      style={{
        background: isDark ? "rgba(10,15,30,0.97)" : "rgba(248,250,252,0.97)",
        borderBottom: `1px solid var(--border)`,
        backdropFilter: "blur(12px)",
      }}
    >
      {/* Left — title */}
      <div>
        {isDatasetRoute && params.id ? (
          <DatasetBreadcrumb id={params.id} />
        ) : info ? (
          <div>
            <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
              {info.title}
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>{info.sub}</p>
          </div>
        ) : (
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>
            CleanOps AI
          </h2>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggle}
          title={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{
            background: "var(--bg-hover)",
            border: `1px solid var(--border)`,
            color: "var(--text-muted)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text-primary)"; e.currentTarget.style.borderColor = "var(--border-strong)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.borderColor = "var(--border)"; }}
        >
          {isDark
            ? <Sun style={{ width: 14, height: 14 }} />
            : <Moon style={{ width: 14, height: 14 }} />
          }
        </button>

        {/* Bell */}
        <button
          className="w-8 h-8 flex items-center justify-center rounded-lg transition-all"
          style={{ background: "var(--bg-hover)", border: `1px solid var(--border)`, color: "var(--text-muted)" }}
        >
          <Bell style={{ width: 14, height: 14 }} />
        </button>

        {/* Upload CTA */}
        <Link
          to="/upload"
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all"
          style={{
            background: "linear-gradient(135deg, var(--accent), #4f46e5)",
            boxShadow: "0 2px 10px rgba(99,102,241,0.3)",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 4px 18px rgba(99,102,241,0.45)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 2px 10px rgba(99,102,241,0.3)"; e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <Upload style={{ width: 13, height: 13 }} />
          Upload
        </Link>
      </div>
    </header>
  );
}

import { useLocation, Link, useParams } from "react-router-dom";
import { Upload, Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useDataset } from "../../hooks/useDatasets";
import JobStatusIndicator from "../jobs/JobStatusIndicator";
import AlertBell from "../alerts/AlertBell";

function DatasetBreadcrumb({ id }) {
  const { data: dataset } = useDataset(id);
  return (
    <div>
      <p className="text-xs" style={{ color: "var(--text-faint)" }}>Dataset Explorer</p>
      <h2 className="text-sm font-semibold leading-tight truncate max-w-xs mt-0.5" style={{ color: "var(--text-primary)" }}>
        {dataset?.name || "Loading…"}
      </h2>
    </div>
  );
}

const PAGE_TITLES = {
  "/":         { title: "Dashboard",       sub: "Overview of your data reliability" },
  "/upload":   { title: "Upload Dataset",  sub: "Import CSV, XLSX, or Parquet files" },
  "/rules":    { title: "Quality Rules",   sub: "Define and manage validation rules" },
  "/alerts":   { title: "Alerts",          sub: "Quality signals and rule management" },
  "/users":    { title: "User Management", sub: "Roles and access control" },
  "/activity": { title: "Team Activity",   sub: "All dataset actions across your workspace" },
};

export default function Header() {
  const { pathname } = useLocation();
  const params = useParams();
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  const isDatasetRoute = pathname.startsWith("/dataset/");
  const info = PAGE_TITLES[pathname];

  return (
    <header className="h-14 flex items-center justify-between px-5 flex-shrink-0"
      style={{
        background: isDark ? "rgba(10,15,30,0.95)" : "rgba(248,250,252,0.95)",
        borderBottom: "1px solid var(--border)",
        backdropFilter: "blur(12px)",
      }}>

      {/* Left — title */}
      <div>
        {isDatasetRoute && params.id ? (
          <DatasetBreadcrumb id={params.id} />
        ) : info ? (
          <div>
            <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{info.title}</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-faint)" }}>{info.sub}</p>
          </div>
        ) : (
          <h2 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>CleanOps AI</h2>
        )}
      </div>

      {/* Right — actions */}
      <div className="flex items-center gap-1.5">
        <button onClick={toggle} title={isDark ? "Light mode" : "Dark mode"} className="icon-btn"
          style={{ border: "1px solid var(--border)" }}>
          {isDark
            ? <Sun  style={{ width: 14, height: 14 }} />
            : <Moon style={{ width: 14, height: 14 }} />}
        </button>

        <JobStatusIndicator />
        <AlertBell />

        <Link to="/upload" className="btn-primary" style={{ padding: "0.375rem 0.875rem" }}>
          <Upload style={{ width: 13, height: 13 }} />
          Upload
        </Link>
      </div>
    </header>
  );
}

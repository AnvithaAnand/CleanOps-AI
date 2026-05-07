import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Upload,
  ShieldCheck,
  Sparkles,
  Database,
  Activity,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../lib/utils";

const links = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard", end: true },
  { to: "/upload", icon: Upload, label: "Upload Dataset", end: false },
  { to: "/rules", icon: ShieldCheck, label: "Quality Rules", end: false },
];

export default function Sidebar() {
  return (
    <aside
      className="w-64 min-h-screen flex flex-col"
      style={{
        background: "linear-gradient(180deg, #080d1a 0%, #0a0f1e 100%)",
        borderRight: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-6 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Database className="w-4.5 h-4.5 text-white" style={{ width: 18, height: 18 }} />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-tight tracking-tight">
              CleanOps AI
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5" style={{ color: "#6366f1", width: 10, height: 10 }} />
              <p className="text-[10px] font-medium" style={{ color: "#6366f1" }}>
                Data Reliability Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#475569" }}>
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150",
                isActive
                  ? "text-white"
                  : "hover:text-white"
              )
            }
            style={({ isActive }) =>
              isActive
                ? {
                    background: "rgba(99, 102, 241, 0.15)",
                    color: "#a5b4fc",
                    borderLeft: "2px solid #6366f1",
                  }
                : {
                    color: "#64748b",
                    borderLeft: "2px solid transparent",
                  }
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className="flex-shrink-0 transition-colors"
                  style={{ width: 16, height: 16, color: isActive ? "#a5b4fc" : "#475569" }}
                />
                <span className="flex-1">{label}</span>
                {isActive && (
                  <ChevronRight style={{ width: 12, height: 12, color: "#6366f1" }} />
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Bottom */}
      <div className="px-4 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.15)" }}
        >
          <Activity style={{ width: 12, height: 12, color: "#10b981" }} />
          <span className="text-xs" style={{ color: "#64748b" }}>
            v1.0 · Phase 2
          </span>
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(16,185,129,0.15)", color: "#10b981" }}
          >
            LIVE
          </span>
        </div>
      </div>
    </aside>
  );
}

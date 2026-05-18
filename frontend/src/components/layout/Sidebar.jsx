import { NavLink } from "react-router-dom";
import { LayoutDashboard, Upload, ShieldCheck, Sparkles, Database, Activity, ChevronRight, Bell } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useUnreadCount } from "../../hooks/useAlerts";

const links = [
  { to: "/",        icon: LayoutDashboard, label: "Dashboard",     end: true },
  { to: "/upload",  icon: Upload,          label: "Upload Dataset", end: false },
  { to: "/rules",   icon: ShieldCheck,     label: "Quality Rules",  end: false },
  { to: "/alerts",  icon: Bell,            label: "Alerts",         end: false, badge: true },
];

export default function Sidebar() {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const { data: unreadAlerts = 0 } = useUnreadCount();

  return (
    <aside
      className="w-64 min-h-screen flex flex-col flex-shrink-0"
      style={{
        background: "var(--bg-sidebar)",
        borderRight: `1px solid var(--border)`,
        transition: "background 0.2s ease",
      }}
    >
      {/* Logo */}
      <div className="px-5 py-5" style={{ borderBottom: `1px solid var(--border)` }}>
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
          >
            <Database style={{ width: 17, height: 17, color: "#fff" }} />
          </div>
          <div>
            <h1 className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>
              CleanOps AI
            </h1>
            <div className="flex items-center gap-1 mt-0.5">
              <Sparkles style={{ width: 9, height: 9, color: "var(--accent)" }} />
              <p className="text-[10px] font-semibold" style={{ color: "var(--accent)" }}>
                Data Reliability Platform
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p
          className="px-3 mb-3 text-[10px] font-bold uppercase tracking-widest"
          style={{ color: "var(--text-faint)" }}
        >
          Navigation
        </p>
        {links.map(({ to, icon: Icon, label, end, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            style={({ isActive }) => ({
              display: "flex",
              alignItems: "center",
              gap: "0.75rem",
              padding: "0.625rem 0.75rem",
              borderRadius: "0.5rem",
              fontSize: "0.875rem",
              fontWeight: 500,
              transition: "all 0.15s ease",
              textDecoration: "none",
              borderLeft: isActive ? `2px solid var(--accent)` : "2px solid transparent",
              background: isActive ? "var(--accent-bg)" : "transparent",
              color: isActive ? "var(--accent-light)" : "var(--text-muted)",
            })}
            onMouseEnter={(e) => {
              if (!e.currentTarget.style.background.includes("accent-bg")) {
                e.currentTarget.style.background = "var(--bg-hover)";
                e.currentTarget.style.color = "var(--text-primary)";
              }
            }}
            onMouseLeave={(e) => {
              const isActive = e.currentTarget.getAttribute("aria-current") === "page";
              if (!isActive) {
                e.currentTarget.style.background = "transparent";
                e.currentTarget.style.color = "var(--text-muted)";
              }
            }}
          >
            {({ isActive }) => (
              <>
                <Icon style={{ width: 15, height: 15, flexShrink: 0, color: isActive ? "var(--accent-light)" : "var(--text-faint)" }} />
                <span className="flex-1">{label}</span>
                {badge && unreadAlerts > 0 && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
                    style={{ background: "#ef4444" }}>
                    {unreadAlerts > 9 ? "9+" : unreadAlerts}
                  </span>
                )}
                {isActive && <ChevronRight style={{ width: 12, height: 12, color: "var(--accent)" }} />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4" style={{ borderTop: `1px solid var(--border)` }}>
        <div
          className="rounded-lg px-3 py-2.5 flex items-center gap-2"
          style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}
        >
          <Activity style={{ width: 11, height: 11, color: "var(--success)" }} />
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>v1.0 · Phase 3</span>
          <span
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded"
            style={{ background: "rgba(16,185,129,0.15)", color: "var(--success)" }}
          >
            LIVE
          </span>
        </div>
      </div>
    </aside>
  );
}

import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Upload, ShieldCheck, Database, Activity, Bell, Users, LogOut, Clock } from "lucide-react";
import { useUnreadCount } from "../../hooks/useAlerts";
import { useAuth } from "../../contexts/AuthContext";

const NAV_LINKS = [
  { to: "/",        icon: LayoutDashboard, label: "Dashboard",      end: true },
  { to: "/upload",  icon: Upload,          label: "Upload Dataset",  end: false },
  { to: "/rules",   icon: ShieldCheck,     label: "Quality Rules",   end: false },
  { to: "/alerts",  icon: Bell,            label: "Alerts",          end: false, badge: true },
  { to: "/activity",icon: Clock,           label: "Activity",        end: false },
];

function NavItem({ to, icon: Icon, label, end, badge, unread }) {
  return (
    <NavLink to={to} end={end} className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}>
      {({ isActive }) => (
        <>
          <Icon style={{ width: 15, height: 15, flexShrink: 0 }} />
          <span className="flex-1 text-sm">{label}</span>
          {badge && unread > 0 && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: "var(--danger)" }}>
              {unread > 9 ? "9+" : unread}
            </span>
          )}
        </>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  const { data: unreadAlerts = 0 } = useUnreadCount();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate("/login"); };

  return (
    <aside className="w-60 min-h-screen flex flex-col flex-shrink-0"
      style={{ background: "var(--bg-sidebar)", borderRight: "1px solid var(--border)" }}>

      {/* Logo */}
      <div className="px-4 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, var(--accent), #8b5cf6)" }}>
            <Database style={{ width: 15, height: 15, color: "#fff" }} />
          </div>
          <div>
            <p className="text-sm font-bold leading-tight" style={{ color: "var(--text-primary)" }}>CleanOps AI</p>
            <p className="text-[10px] mt-0.5" style={{ color: "var(--text-faint)" }}>Data Reliability Platform</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        <p className="section-label px-2 mb-3">Navigation</p>
        {NAV_LINKS.map((link) => (
          <NavItem key={link.to} {...link} unread={unreadAlerts} />
        ))}
        {isAdmin && <NavItem to="/users" icon={Users} label="Users" end={false} />}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4" style={{ borderTop: "1px solid var(--border)" }}>
        {user && (
          <div className="flex items-center gap-2.5 mb-3 px-1">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-bold flex-shrink-0"
              style={{ background: "var(--accent-bg)", color: "var(--accent)" }}>
              {user.full_name?.[0]?.toUpperCase() || "?"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{user.full_name}</p>
              <p className="text-[10px] capitalize" style={{ color: "var(--text-faint)" }}>{user.role}</p>
            </div>
            <button onClick={handleLogout} title="Sign out" className="btn-danger-ghost p-1.5 rounded-md">
              <LogOut style={{ width: 13, height: 13 }} />
            </button>
          </div>
        )}
        <div className="flex items-center gap-2 px-2 py-2 rounded-lg"
          style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}>
          <Activity style={{ width: 10, height: 10, color: "var(--success)" }} />
          <span className="text-[11px]" style={{ color: "var(--text-muted)" }}>v1.0 · Phase 5</span>
          <span className="ml-auto badge badge-success" style={{ fontSize: "9px", padding: "1px 6px" }}>LIVE</span>
        </div>
      </div>
    </aside>
  );
}

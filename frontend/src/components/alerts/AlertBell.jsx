import { useState } from "react";
import { Bell, X, CheckCheck, AlertTriangle, Info, Zap } from "lucide-react";
import { useUnreadCount, useAlerts, useMarkRead, useDeleteAlert } from "../../hooks/useAlerts";
import { formatDate } from "../../lib/utils";

const severityConfig = {
  critical: { color: "var(--danger)",  bg: "rgba(239,68,68,0.1)",   Icon: Zap },
  warning:  { color: "#f59e0b",         bg: "rgba(245,158,11,0.1)",  Icon: AlertTriangle },
  info:     { color: "var(--accent)",  bg: "var(--accent-bg)",       Icon: Info },
};

export default function AlertBell() {
  const [open, setOpen] = useState(false);
  const { data: count = 0 } = useUnreadCount();
  const { data: alerts = [] } = useAlerts({ limit: 20 });
  const markRead = useMarkRead();
  const deleteAlert = useDeleteAlert();

  const handleOpen = () => {
    setOpen((v) => !v);
    if (!open && count > 0) {
      markRead.mutate({});
    }
  };

  return (
    <div className="relative">
      <button
        onClick={handleOpen}
        className="relative w-8 h-8 flex items-center justify-center rounded-lg transition-all"
        style={{
          background: count > 0 ? "rgba(245,158,11,0.1)" : "var(--bg-hover)",
          border: `1px solid ${count > 0 ? "rgba(245,158,11,0.3)" : "var(--border)"}`,
          color: count > 0 ? "#f59e0b" : "var(--text-muted)",
        }}
        title="Alerts"
      >
        <Bell style={{ width: 14, height: 14 }} />
        {count > 0 && (
          <span
            className="absolute -top-1 -right-1 w-4 h-4 rounded-full text-[9px] font-bold flex items-center justify-center text-white"
            style={{ background: "#ef4444" }}
          >
            {count > 9 ? "9+" : count}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 top-full mt-2 w-96 rounded-xl overflow-hidden z-50 animate-fade-in"
            style={{
              background: "var(--bg-card)",
              border: "1px solid var(--border-strong)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3)",
            }}
          >
            <div
              className="flex items-center justify-between px-4 py-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>
                Alerts
                {count > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 rounded text-[10px]"
                    style={{ background: "rgba(239,68,68,0.15)", color: "#ef4444" }}>
                    {count} unread
                  </span>
                )}
              </p>
              {alerts.length > 0 && (
                <button
                  onClick={() => markRead.mutate({})}
                  className="flex items-center gap-1 text-[10px] font-medium transition-colors"
                  style={{ color: "var(--text-muted)" }}
                >
                  <CheckCheck style={{ width: 11, height: 11 }} /> Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className="py-10 text-center">
                  <Bell style={{ width: 24, height: 24, color: "var(--text-faint)", margin: "0 auto 8px" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>No alerts yet</p>
                </div>
              ) : (
                alerts.map((alert) => {
                  const cfg = severityConfig[alert.severity] || severityConfig.info;
                  const { Icon } = cfg;
                  return (
                    <div
                      key={alert.id}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        borderBottom: "1px solid var(--border)",
                        background: alert.is_read ? "transparent" : "rgba(99,102,241,0.03)",
                      }}
                    >
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: cfg.bg }}>
                        <Icon style={{ width: 11, height: 11, color: cfg.color }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                          {alert.title}
                        </p>
                        <p className="text-[10px] mt-0.5 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                          {alert.message}
                        </p>
                        <p className="text-[10px] mt-1" style={{ color: "var(--text-faint)" }}>
                          {formatDate(alert.created_at)}
                        </p>
                      </div>
                      <button
                        onClick={() => deleteAlert.mutate(alert.id)}
                        className="flex-shrink-0 mt-0.5 w-5 h-5 flex items-center justify-center rounded opacity-0 hover:opacity-100 transition-opacity"
                        style={{ color: "var(--text-faint)" }}
                        onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                        onMouseLeave={(e) => e.currentTarget.style.opacity = "0"}
                      >
                        <X style={{ width: 11, height: 11 }} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

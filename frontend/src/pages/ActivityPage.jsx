import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { Activity, Upload, Wrench, ShieldCheck, RefreshCw, FileText, ArrowUpRight } from "lucide-react";
import client from "../api/client";

const ACTION_CONFIG = {
  upload:           { icon: Upload,      color: "#6366f1", bg: "rgba(99,102,241,0.1)",  label: "Upload" },
  profile:          { icon: Activity,    color: "#06b6d4", bg: "rgba(6,182,212,0.1)",   label: "Profile" },
  repair_complete:  { icon: Wrench,      color: "#10b981", bg: "rgba(16,185,129,0.1)",  label: "Repair" },
  validate:         { icon: ShieldCheck, color: "#8b5cf6", bg: "rgba(139,92,246,0.1)",  label: "Validate" },
  scheduled_scan:   { icon: RefreshCw,   color: "#f59e0b", bg: "rgba(245,158,11,0.1)",  label: "Scheduled Scan" },
};

function getConfig(action) {
  return ACTION_CONFIG[action] || { icon: FileText, color: "var(--text-muted)", bg: "var(--bg-hover)", label: action };
}

function formatTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export default function ActivityPage() {
  const { data: events = [], isLoading } = useQuery({
    queryKey: ["activity"],
    queryFn: () => client.get("/api/activity/?limit=100").then((r) => r.data),
    refetchInterval: 30000,
  });

  return (
    <div className="max-w-3xl mx-auto space-y-5 animate-fade-in">
      <div>
        <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Team Activity</h2>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          All dataset actions across your workspace, newest first
        </p>
      </div>

      <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
        {isLoading ? (
          <div className="space-y-px">
            {[1,2,3,4,5].map((i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="w-8 h-8 rounded-lg shimmer flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3 shimmer rounded w-48" />
                  <div className="h-2.5 shimmer rounded w-72" />
                </div>
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-16">
            <Activity style={{ width: 28, height: 28, color: "var(--text-faint)", margin: "0 auto 12px" }} />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No activity yet</p>
            <p className="text-xs mt-1" style={{ color: "var(--text-faint)" }}>Upload a dataset to get started</p>
          </div>
        ) : (
          events.map((event, i) => {
            const cfg = getConfig(event.action);
            const Icon = cfg.icon;
            return (
              <div
                key={event.id}
                className="table-row-hover flex items-start gap-4 px-5 py-4"
                style={{ borderBottom: i < events.length - 1 ? "1px solid var(--border)" : "none" }}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                  style={{ background: cfg.bg }}>
                  <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold px-1.5 py-0.5 rounded"
                      style={{ background: cfg.bg, color: cfg.color }}>
                      {cfg.label}
                    </span>
                    <Link to={`/dataset/${event.dataset_id}`}
                      className="text-xs font-medium hover:underline flex items-center gap-0.5"
                      style={{ color: "var(--accent)", textDecoration: "none" }}
                      onClick={(e) => e.stopPropagation()}>
                      {event.dataset_name}
                      <ArrowUpRight style={{ width: 10, height: 10 }} />
                    </Link>
                  </div>
                  <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                    {event.description}
                  </p>
                </div>
                <span className="text-[10px] flex-shrink-0 mt-1" style={{ color: "var(--text-faint)" }}>
                  {formatTime(event.created_at)}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import { Bell, Trash2, ToggleLeft, ToggleRight, Plus, Zap, AlertTriangle, Info, Loader2, X } from "lucide-react";
import { useAlerts, useAlertRules, useDeleteAlert, useMarkRead, useToggleRule, useDeleteRule, useCreateRule } from "../hooks/useAlerts";
import { formatDate } from "../lib/utils";

const severityConfig = {
  critical: { color: "var(--danger)", bg: "rgba(239,68,68,0.1)", border: "rgba(239,68,68,0.2)", label: "Critical", Icon: Zap },
  warning:  { color: "#f59e0b",        bg: "rgba(245,158,11,0.1)", border: "rgba(245,158,11,0.2)", label: "Warning", Icon: AlertTriangle },
  info:     { color: "var(--accent)", bg: "var(--accent-bg)",      border: "var(--accent-border)", label: "Info", Icon: Info },
};

const CONDITION_TYPES = [
  { value: "trust_score_below",  label: "Trust score drops below",  hasThreshold: true,  suffix: "%" },
  { value: "issue_count_above",  label: "Issue count exceeds",       hasThreshold: true,  suffix: "issues" },
  { value: "null_rate_above",    label: "Null rate exceeds",         hasThreshold: true,  suffix: "%" },
  { value: "drift_detected",     label: "Drift is detected",         hasThreshold: false, suffix: "" },
];

function NewRuleModal({ onClose }) {
  const [condition, setCondition] = useState("trust_score_below");
  const [threshold, setThreshold] = useState("70");
  const [name, setName] = useState("");
  const createRule = useCreateRule();

  const conditionMeta = CONDITION_TYPES.find((c) => c.value === condition);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await createRule.mutateAsync({
      name: name.trim(),
      condition_type: condition,
      threshold: conditionMeta?.hasThreshold ? parseFloat(threshold) : null,
    });
    onClose();
  };

  const fieldStyle = { background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative w-full max-w-md rounded-2xl overflow-hidden z-10 animate-fade-in"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border-strong)" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid var(--border)" }}>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>New Alert Rule</h3>
          <button onClick={onClose}><X style={{ width: 16, height: 16, color: "var(--text-muted)" }} /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Rule Name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Critical trust score alert"
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>Condition</label>
            <select value={condition} onChange={(e) => setCondition(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle}>
              {CONDITION_TYPES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          {conditionMeta?.hasThreshold && (
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "var(--text-muted)" }}>
                Threshold ({conditionMeta.suffix})
              </label>
              <input type="number" value={threshold} onChange={(e) => setThreshold(e.target.value)}
                className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
            </div>
          )}
        </div>
        <div className="flex items-center justify-end gap-3 px-5 py-4" style={{ borderTop: "1px solid var(--border)" }}>
          <button onClick={onClose} className="text-xs px-4 py-2 rounded-lg" style={{ color: "var(--text-muted)" }}>Cancel</button>
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || createRule.isPending}
            className="text-xs px-4 py-2 rounded-lg font-semibold text-white disabled:opacity-40"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}
          >
            {createRule.isPending ? "Creating..." : "Create Rule"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function AlertsPage() {
  const [view, setView] = useState("alerts");
  const [showNew, setShowNew] = useState(false);
  const { data: alerts = [], isLoading: loadingAlerts } = useAlerts({ limit: 100 });
  const { data: rules = [], isLoading: loadingRules } = useAlertRules();
  const deleteAlert = useDeleteAlert();
  const markRead = useMarkRead();
  const toggleRule = useToggleRule();
  const deleteRule = useDeleteRule();

  return (
    <div className="max-w-4xl mx-auto space-y-5 animate-fade-in">
      {showNew && <NewRuleModal onClose={() => setShowNew(false)} />}

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Alerts</h2>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Automated quality signals and rule management
          </p>
        </div>
        <div className="flex items-center gap-2">
          {alerts.some((a) => !a.is_read) && (
            <button onClick={() => markRead.mutate({})}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}>
              Mark all read
            </button>
          )}
          <button onClick={() => setShowNew(true)}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}>
            <Plus style={{ width: 12, height: 12 }} /> New Rule
          </button>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex gap-1 p-1 rounded-xl" style={{ background: "var(--bg-hover)", width: "fit-content" }}>
        {["alerts", "rules"].map((t) => (
          <button key={t} onClick={() => setView(t)}
            className="px-4 py-1.5 rounded-lg text-xs font-medium capitalize transition-all"
            style={{
              background: view === t ? "var(--bg-card)" : "transparent",
              color: view === t ? "var(--accent)" : "var(--text-muted)",
              border: view === t ? "1px solid var(--border)" : "1px solid transparent",
            }}>
            {t === "alerts" ? `Alerts (${alerts.length})` : `Rules (${rules.length})`}
          </button>
        ))}
      </div>

      {/* Alerts list */}
      {view === "alerts" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {loadingAlerts ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 style={{ width: 20, height: 20 }} className="animate-spin" style={{ color: "var(--text-muted)" }} />
            </div>
          ) : alerts.length === 0 ? (
            <div className="py-16 text-center">
              <Bell style={{ width: 32, height: 32, margin: "0 auto 12px", color: "var(--text-faint)" }} />
              <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>No alerts yet</p>
              <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                Alerts fire automatically when datasets are profiled or repaired.
              </p>
            </div>
          ) : (
            alerts.map((alert) => {
              const cfg = severityConfig[alert.severity] || severityConfig.info;
              const { Icon } = cfg;
              return (
                <div key={alert.id}
                  className="flex items-start gap-4 px-5 py-4"
                  style={{
                    borderBottom: "1px solid var(--border)",
                    background: alert.is_read ? "transparent" : "rgba(99,102,241,0.025)",
                  }}>
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}>
                    <Icon style={{ width: 14, height: 14, color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>{alert.title}</p>
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                        style={{ background: cfg.bg, color: cfg.color }}>{cfg.label}</span>
                      {!alert.is_read && (
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: "var(--accent)" }} />
                      )}
                    </div>
                    <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>{alert.message}</p>
                    <p className="text-[10px] mt-1.5" style={{ color: "var(--text-faint)" }}>{formatDate(alert.created_at)}</p>
                  </div>
                  <button onClick={() => deleteAlert.mutate(alert.id)}
                    className="flex-shrink-0 mt-1 w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: "var(--text-faint)" }}
                    onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-faint)"; }}>
                    <Trash2 style={{ width: 13, height: 13 }} />
                  </button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* Rules list */}
      {view === "rules" && (
        <div className="rounded-2xl overflow-hidden" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
          {loadingRules ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 style={{ width: 20, height: 20, color: "var(--text-muted)" }} className="animate-spin" />
            </div>
          ) : rules.length === 0 ? (
            <div className="py-16 text-center">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>No rules yet — click New Rule to add one.</p>
            </div>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: "1px solid var(--border)", opacity: rule.is_active ? 1 : 0.5 }}>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.name}</p>
                  <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                    {CONDITION_TYPES.find((c) => c.value === rule.condition_type)?.label || rule.condition_type}
                    {rule.threshold != null && ` ${rule.threshold}`}
                  </p>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{
                    background: rule.is_active ? "rgba(16,185,129,0.1)" : "var(--bg-hover)",
                    color: rule.is_active ? "var(--success)" : "var(--text-faint)",
                    border: `1px solid ${rule.is_active ? "rgba(16,185,129,0.25)" : "var(--border)"}`,
                  }}>
                  {rule.is_active ? "Active" : "Paused"}
                </span>
                <button onClick={() => toggleRule.mutate(rule.id)} title={rule.is_active ? "Pause" : "Activate"}>
                  {rule.is_active
                    ? <ToggleRight style={{ width: 20, height: 20, color: "var(--success)" }} />
                    : <ToggleLeft  style={{ width: 20, height: 20, color: "var(--text-faint)" }} />
                  }
                </button>
                <button onClick={() => deleteRule.mutate(rule.id)}
                  className="w-7 h-7 flex items-center justify-center rounded-lg"
                  style={{ color: "var(--text-faint)" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.1)"; e.currentTarget.style.color = "#ef4444"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-faint)"; }}>
                  <Trash2 style={{ width: 13, height: 13 }} />
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

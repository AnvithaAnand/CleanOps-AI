import { useState } from "react";
import { ShieldCheck, Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRules, useCreateRule, useDeleteRule } from "../hooks/useRules";
import { useDatasets } from "../hooks/useDatasets";

const RULE_TYPES = [
  { value: "not_null",   label: "Not Null",       params: [] },
  { value: "unique",     label: "Unique",          params: [] },
  { value: "range",      label: "Range",           params: [
    { key: "min", label: "Minimum", type: "number" },
    { key: "max", label: "Maximum", type: "number" },
  ]},
  { value: "regex",      label: "Regex Pattern",   params: [
    { key: "pattern", label: "Pattern", type: "text" },
  ]},
  { value: "enum",       label: "Allowed Values",  params: [
    { key: "values", label: "Values (comma-separated)", type: "text", isArray: true },
  ]},
  { value: "type_check", label: "Type Check",      params: [
    { key: "type", label: "Expected Type", type: "select", options: ["integer", "float", "datetime", "string"] },
  ]},
  { value: "length",     label: "String Length",   params: [
    { key: "min", label: "Min Length", type: "number" },
    { key: "max", label: "Max Length", type: "number" },
  ]},
];

const severityColors = {
  critical: { bg: "rgba(220,38,38,0.12)",  color: "#dc2626" },
  warning:  { bg: "rgba(245,158,11,0.12)", color: "#f59e0b" },
  info:     { bg: "rgba(99,102,241,0.12)", color: "#818cf8" },
};

function FormField({ label, children }) {
  return (
    <div>
      <label
        className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
        style={{ color: "var(--text-muted)" }}
      >
        {label}
      </label>
      {children}
    </div>
  );
}


export default function RuleBuilder() {
  const { data: rules, isLoading } = useRules();
  const { data: datasets } = useDatasets();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();

  const [form, setForm] = useState({
    name: "", dataset_id: "", column_name: "",
    rule_type: "not_null", severity: "warning", parameters: {},
  });

  const ruleType = RULE_TYPES.find((r) => r.value === form.rule_type);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.rule_type) return;
    const params = { ...form.parameters };
    ruleType?.params.forEach((p) => {
      if (p.isArray && typeof params[p.key] === "string") {
        params[p.key] = params[p.key].split(",").map((v) => v.trim());
      }
      if (p.type === "number" && params[p.key] != null) {
        params[p.key] = Number(params[p.key]);
      }
    });
    try {
      await createRule.mutateAsync({
        name: form.name,
        dataset_id: form.dataset_id || null,
        column_name: form.column_name || null,
        rule_type: form.rule_type,
        severity: form.severity,
        parameters: params,
      });
      setForm({ name: "", dataset_id: "", column_name: "", rule_type: "not_null", severity: "warning", parameters: {} });
    } catch (err) {
      toast.error("Failed to create rule: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-fade-in">

      {/* ── Create Form ─────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        {/* Section header */}
        <div
          className="h-0.5 w-full -mt-6 -mx-6 mb-6 rounded-t-2xl"
          style={{ width: "calc(100% + 3rem)", background: "linear-gradient(90deg, #6366f1, #8b5cf6)" }}
        />
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
          >
            <Plus style={{ width: 15, height: 15, color: "var(--accent)" }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Create Quality Rule</h3>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField label="Rule Name">
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Age must be positive"
              className="co-input"
              required
            />
          </FormField>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Dataset">
              <select
                value={form.dataset_id}
                onChange={(e) => setForm({ ...form, dataset_id: e.target.value })}
                className="co-input"
              >
                <option value="">Global (all)</option>
                {datasets?.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </FormField>
            <FormField label="Column">
              <input
                type="text"
                value={form.column_name}
                onChange={(e) => setForm({ ...form, column_name: e.target.value })}
                placeholder="Column name"
                className="co-input"
              />
            </FormField>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FormField label="Rule Type">
              <select
                value={form.rule_type}
                onChange={(e) => setForm({ ...form, rule_type: e.target.value, parameters: {} })}
                className="co-input"
              >
                {RULE_TYPES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </FormField>
            <FormField label="Severity">
              <select
                value={form.severity}
                onChange={(e) => setForm({ ...form, severity: e.target.value })}
                className="co-input"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </FormField>
          </div>

          {ruleType?.params.map((p) => (
            <FormField key={p.key} label={p.label}>
              {p.type === "select" ? (
                <select
                  value={form.parameters[p.key] || ""}
                  onChange={(e) => setForm({ ...form, parameters: { ...form.parameters, [p.key]: e.target.value } })}
                  className="co-input"
                >
                  <option value="">Select...</option>
                  {p.options.map((o) => <option key={o} value={o}>{o}</option>)}
                </select>
              ) : (
                <input
                  type={p.type}
                  value={form.parameters[p.key] || ""}
                  onChange={(e) => setForm({ ...form, parameters: { ...form.parameters, [p.key]: e.target.value } })}
                  placeholder={p.label}
                  className="co-input"
                />
              )}
            </FormField>
          ))}

          <button
            type="submit"
            disabled={createRule.isPending}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
            style={{
              background: "linear-gradient(135deg, var(--accent), #4f46e5)",
              boxShadow: "0 2px 12px rgba(99,102,241,0.3)",
            }}
          >
            {createRule.isPending
              ? <Loader2 style={{ width: 14, height: 14 }} className="animate-spin" />
              : <ShieldCheck style={{ width: 14, height: 14 }} />
            }
            Create Rule
          </button>
        </form>
      </div>

      {/* ── Rules List ──────────────────────────────── */}
      <div
        className="rounded-2xl p-6"
        style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}
      >
        <div
          className="h-0.5 w-full -mt-6 -mx-6 mb-6 rounded-t-2xl"
          style={{ width: "calc(100% + 3rem)", background: "linear-gradient(90deg, #8b5cf6, #06b6d4)" }}
        />
        <div className="flex items-center gap-2 mb-5">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: "var(--accent-bg)", border: "1px solid var(--accent-border)" }}
          >
            <ShieldCheck style={{ width: 15, height: 15, color: "var(--accent)" }} />
          </div>
          <h3 className="text-base font-semibold" style={{ color: "var(--text-primary)" }}>Active Rules</h3>
          {rules?.length > 0 && (
            <span
              className="ml-auto text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}
            >
              {rules.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 style={{ width: 20, height: 20, color: "var(--accent)" }} className="animate-spin" />
          </div>
        ) : !rules?.length ? (
          <div
            className="text-center py-10 rounded-xl"
            style={{ background: "var(--bg-hover)", border: "1px dashed var(--border)" }}
          >
            <ShieldCheck style={{ width: 24, height: 24, color: "var(--text-faint)" }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>No rules created yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {rules.map((rule) => {
              const sev = severityColors[rule.severity] || severityColors.info;
              return (
                <div
                  key={rule.id}
                  className="co-card flex items-center justify-between p-3"
                  style={{ background: "var(--bg-hover)" }}
                >
                  <div>
                    <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>{rule.name}</p>
                    <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                      {rule.rule_type} · {rule.column_name || "all columns"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: sev.bg, color: sev.color }}
                    >
                      {rule.severity}
                    </span>
                    <button
                      onClick={() => toast("Delete this rule?", { action: { label: "Delete", onClick: () => deleteRule.mutate(rule.id) } })}
                      className="btn-danger-ghost w-6 h-6"
                    >
                      <Trash2 style={{ width: 13, height: 13 }} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  ShieldCheck,
  Plus,
  Trash2,
  Loader2,
} from "lucide-react";
import { useRules, useCreateRule, useDeleteRule } from "../hooks/useRules";
import { useDatasets } from "../hooks/useDatasets";
import { cn, getSeverityColor } from "../lib/utils";

const RULE_TYPES = [
  { value: "not_null", label: "Not Null", params: [] },
  { value: "unique", label: "Unique", params: [] },
  {
    value: "range",
    label: "Range",
    params: [
      { key: "min", label: "Minimum", type: "number" },
      { key: "max", label: "Maximum", type: "number" },
    ],
  },
  {
    value: "regex",
    label: "Regex Pattern",
    params: [{ key: "pattern", label: "Pattern", type: "text" }],
  },
  {
    value: "enum",
    label: "Allowed Values",
    params: [
      {
        key: "values",
        label: "Values (comma-separated)",
        type: "text",
        isArray: true,
      },
    ],
  },
  {
    value: "type_check",
    label: "Type Check",
    params: [
      {
        key: "type",
        label: "Expected Type",
        type: "select",
        options: ["integer", "float", "datetime", "string"],
      },
    ],
  },
  {
    value: "length",
    label: "String Length",
    params: [
      { key: "min", label: "Min Length", type: "number" },
      { key: "max", label: "Max Length", type: "number" },
    ],
  },
];

export default function RuleBuilder() {
  const { data: rules, isLoading } = useRules();
  const { data: datasets } = useDatasets();
  const createRule = useCreateRule();
  const deleteRule = useDeleteRule();

  const [form, setForm] = useState({
    name: "",
    dataset_id: "",
    column_name: "",
    rule_type: "not_null",
    severity: "warning",
    parameters: {},
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
      setForm({
        name: "",
        dataset_id: "",
        column_name: "",
        rule_type: "not_null",
        severity: "warning",
        parameters: {},
      });
    } catch (err) {
      alert("Failed to create rule: " + (err.response?.data?.detail || err.message));
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-base font-semibold mb-4 flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Quality Rule
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-foreground">
              Rule Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g., Age must be positive"
              className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Dataset</label>
              <select
                value={form.dataset_id}
                onChange={(e) =>
                  setForm({ ...form, dataset_id: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              >
                <option value="">Global (all datasets)</option>
                {datasets?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Column</label>
              <input
                type="text"
                value={form.column_name}
                onChange={(e) =>
                  setForm({ ...form, column_name: e.target.value })
                }
                placeholder="Column name"
                className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Rule Type</label>
              <select
                value={form.rule_type}
                onChange={(e) =>
                  setForm({
                    ...form,
                    rule_type: e.target.value,
                    parameters: {},
                  })
                }
                className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              >
                {RULE_TYPES.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Severity</label>
              <select
                value={form.severity}
                onChange={(e) =>
                  setForm({ ...form, severity: e.target.value })
                }
                className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
              >
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>
          </div>

          {ruleType?.params.map((p) => (
            <div key={p.key}>
              <label className="text-sm font-medium">{p.label}</label>
              {p.type === "select" ? (
                <select
                  value={form.parameters[p.key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      parameters: {
                        ...form.parameters,
                        [p.key]: e.target.value,
                      },
                    })
                  }
                  className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                >
                  <option value="">Select...</option>
                  {p.options.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={p.type}
                  value={form.parameters[p.key] || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      parameters: {
                        ...form.parameters,
                        [p.key]: e.target.value,
                      },
                    })
                  }
                  placeholder={p.label}
                  className="mt-1 w-full px-3 py-2 bg-background border border-input rounded-lg text-sm"
                />
              )}
            </div>
          ))}

          <button
            type="submit"
            disabled={createRule.isPending}
            className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {createRule.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <ShieldCheck className="w-4 h-4" />
            )}
            Create Rule
          </button>
        </form>
      </div>

      <div className="bg-card border border-border rounded-xl p-6">
        <h3 className="text-base font-semibold mb-4">Existing Rules</h3>

        {isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin" />
          </div>
        ) : rules?.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground text-sm">
            No rules created yet
          </div>
        ) : (
          <div className="space-y-2">
            {rules?.map((rule) => (
              <div
                key={rule.id}
                className="flex items-center justify-between p-3 border border-border rounded-lg"
              >
                <div>
                  <p className="text-sm font-medium">{rule.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {rule.rule_type} •{" "}
                    {rule.column_name || "all columns"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-xs font-medium",
                      getSeverityColor(rule.severity)
                    )}
                  >
                    {rule.severity}
                  </span>
                  <button
                    onClick={() => {
                      if (confirm("Delete this rule?")) {
                        deleteRule.mutate(rule.id);
                      }
                    }}
                    className="p-1 text-muted-foreground hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

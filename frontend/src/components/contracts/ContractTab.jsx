import { useState, useEffect } from "react";
import { Plus, Trash2, CheckCircle, XCircle, Loader2, Save, PlayCircle } from "lucide-react";
import { useContract, useUpsertContract, useDeleteContract, useValidateContract } from "../../hooks/useContracts";

const DATA_TYPES = ["string", "int", "float", "bool", "datetime", "date"];

function SchemaEditor({ columns, onChange }) {
  const addCol = () => onChange([...columns, { name: "", type: "string", required: true }]);
  const removeCol = (i) => onChange(columns.filter((_, idx) => idx !== i));
  const updateCol = (i, field, value) => onChange(
    columns.map((c, idx) => idx === i ? { ...c, [field]: value } : c)
  );

  const inputStyle = { background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" };

  return (
    <div className="space-y-2">
      {columns.map((col, i) => (
        <div key={i} className="flex items-center gap-2">
          <input
            value={col.name}
            onChange={(e) => updateCol(i, "name", e.target.value)}
            placeholder="column_name"
            className="flex-1 px-2.5 py-1.5 rounded-lg text-xs font-mono outline-none"
            style={inputStyle}
          />
          <select
            value={col.type || "string"}
            onChange={(e) => updateCol(i, "type", e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs outline-none"
            style={inputStyle}
          >
            {DATA_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
          <label className="flex items-center gap-1 text-[11px] cursor-pointer" style={{ color: "var(--text-muted)" }}>
            <input type="checkbox" checked={col.required}
              onChange={(e) => updateCol(i, "required", e.target.checked)}
              className="w-3 h-3" />
            required
          </label>
          <button onClick={() => removeCol(i)}>
            <Trash2 style={{ width: 13, height: 13, color: "var(--text-faint)" }} />
          </button>
        </div>
      ))}
      <button
        onClick={addCol}
        className="flex items-center gap-1.5 text-xs font-medium mt-1"
        style={{ color: "var(--accent)" }}
      >
        <Plus style={{ width: 12, height: 12 }} /> Add column
      </button>
    </div>
  );
}

export default function ContractTab({ datasetId }) {
  const { data: contract, isLoading } = useContract(datasetId);
  const upsert = useUpsertContract(datasetId);
  const del = useDeleteContract(datasetId);
  const validate = useValidateContract(datasetId);

  const [form, setForm] = useState({
    name: "Data Contract",
    min_trust_score: "",
    max_null_percentage: "",
    min_row_count: "",
    freshness_sla_hours: "",
    schema_definition: [],
  });
  const [violations, setViolations] = useState(null);

  useEffect(() => {
    if (contract) {
      setForm({
        name: contract.name || "Data Contract",
        min_trust_score: contract.min_trust_score ?? "",
        max_null_percentage: contract.max_null_percentage ?? "",
        min_row_count: contract.min_row_count ?? "",
        freshness_sla_hours: contract.freshness_sla_hours ?? "",
        schema_definition: contract.schema_definition || [],
      });
    }
  }, [contract]);

  const handleSave = async () => {
    const body = {
      name: form.name || "Data Contract",
      schema_definition: form.schema_definition.filter((c) => c.name.trim()),
      min_trust_score: form.min_trust_score !== "" ? parseFloat(form.min_trust_score) : null,
      max_null_percentage: form.max_null_percentage !== "" ? parseFloat(form.max_null_percentage) : null,
      min_row_count: form.min_row_count !== "" ? parseInt(form.min_row_count) : null,
      freshness_sla_hours: form.freshness_sla_hours !== "" ? parseInt(form.freshness_sla_hours) : null,
    };
    await upsert.mutateAsync(body);
    setViolations(null);
  };

  const handleValidate = async () => {
    const result = await validate.mutateAsync();
    setViolations(result.data.violations);
  };

  const fieldStyle = { background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" };
  const labelStyle = { color: "var(--text-muted)" };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 style={{ width: 18, height: 18, color: "var(--text-muted)" }} className="animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Data Contract</h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            Define expected schema, quality thresholds, and SLAs for this dataset
          </p>
        </div>
        <div className="flex items-center gap-2">
          {contract && (
            <button
              onClick={handleValidate}
              disabled={validate.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-muted)" }}
            >
              {validate.isPending
                ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
                : <PlayCircle style={{ width: 12, height: 12 }} />
              }
              Validate Now
            </button>
          )}
          <button
            onClick={handleSave}
            disabled={upsert.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}
          >
            {upsert.isPending
              ? <Loader2 style={{ width: 12, height: 12 }} className="animate-spin" />
              : <Save style={{ width: 12, height: 12 }} />
            }
            Save Contract
          </button>
          {contract && (
            <button onClick={() => del.mutate()} className="text-xs px-2 py-1.5 rounded-lg"
              style={{ color: "var(--danger)" }}>
              Delete
            </button>
          )}
        </div>
      </div>

      {/* Validation results */}
      {violations !== null && (
        <div
          className="rounded-xl p-4"
          style={{
            background: violations.length === 0 ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)",
            border: `1px solid ${violations.length === 0 ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          <div className="flex items-center gap-2 mb-2">
            {violations.length === 0
              ? <CheckCircle style={{ width: 14, height: 14, color: "var(--success)" }} />
              : <XCircle style={{ width: 14, height: 14, color: "var(--danger)" }} />
            }
            <span className="text-xs font-semibold"
              style={{ color: violations.length === 0 ? "var(--success)" : "var(--danger)" }}>
              {violations.length === 0 ? "All contract checks passed" : `${violations.length} violation(s) found`}
            </span>
          </div>
          {violations.map((v, i) => (
            <p key={i} className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              · {v.message}
            </p>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-5">
        {/* Contract name */}
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Contract name</label>
          <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>

        {/* Quality thresholds */}
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Min trust score (%)</label>
          <input type="number" value={form.min_trust_score} placeholder="e.g. 80"
            onChange={(e) => setForm((f) => ({ ...f, min_trust_score: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Max null rate (%)</label>
          <input type="number" value={form.max_null_percentage} placeholder="e.g. 10"
            onChange={(e) => setForm((f) => ({ ...f, max_null_percentage: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Min row count</label>
          <input type="number" value={form.min_row_count} placeholder="e.g. 1000"
            onChange={(e) => setForm((f) => ({ ...f, min_row_count: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>
        <div>
          <label className="block text-xs font-medium mb-1.5" style={labelStyle}>Freshness SLA (hours)</label>
          <input type="number" value={form.freshness_sla_hours} placeholder="e.g. 24"
            onChange={(e) => setForm((f) => ({ ...f, freshness_sla_hours: e.target.value }))}
            className="w-full px-3 py-2.5 rounded-lg text-sm outline-none" style={fieldStyle} />
        </div>

        {/* Schema definition */}
        <div className="col-span-2">
          <label className="block text-xs font-medium mb-2" style={labelStyle}>Expected Schema</label>
          <div className="rounded-xl p-4" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
            <SchemaEditor
              columns={form.schema_definition}
              onChange={(cols) => setForm((f) => ({ ...f, schema_definition: cols }))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

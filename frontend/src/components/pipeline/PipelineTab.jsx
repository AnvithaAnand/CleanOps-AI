import { useState } from "react";
import { CheckCircle, XCircle, Zap, Trash2, Plus, ToggleLeft, ToggleRight, Copy } from "lucide-react";
import { useWebhooks, useCreateWebhook, useDeleteWebhook, useUpdateWebhook, useQualityGate } from "../../hooks/usePipeline";
import { useDataset } from "../../hooks/useDatasets";

const ALL_EVENTS = ["scan.completed", "alert.fired", "contract.violated", "trust_score.dropped"];

function GateSection({ datasetId }) {
  const { data: dataset } = useDataset(datasetId);
  const [threshold, setThreshold] = useState(80);
  const gate = useQualityGate(datasetId, threshold);
  const score = dataset?.trust_score;

  const result = gate.data?.data;
  const failed = gate.error;

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div>
        <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Quality Gate</p>
        <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
          Use this endpoint in CI/CD to block deploys when data quality is too low.
        </p>
      </div>

      {/* Current score */}
      <div className="flex items-center gap-3">
        <div className="rounded-lg px-3 py-2 flex items-center gap-2" style={{ background: "var(--bg-hover)" }}>
          <span className="text-xs" style={{ color: "var(--text-muted)" }}>Current trust score:</span>
          <span className="text-sm font-bold" style={{ color: score != null ? (score >= threshold ? "var(--success)" : "var(--danger)") : "var(--text-faint)" }}>
            {score != null ? `${score.toFixed(1)}` : "—"}
          </span>
        </div>
      </div>

      {/* Threshold + test */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <label className="text-xs" style={{ color: "var(--text-muted)" }}>Min score:</label>
          <input
            type="number" min={0} max={100} value={threshold}
            onChange={(e) => setThreshold(Number(e.target.value))}
            className="w-16 text-xs px-2 py-1.5 rounded-lg outline-none"
            style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
          />
        </div>
        <button
          onClick={() => gate.mutate()}
          disabled={gate.isPending}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}
        >
          <Zap style={{ width: 11, height: 11 }} />
          {gate.isPending ? "Checking..." : "Run Gate Check"}
        </button>
      </div>

      {/* Result */}
      {(result || failed) && (
        <div
          className="rounded-lg p-3 flex items-start gap-3"
          style={{
            background: result ? "rgba(16,185,129,0.08)" : "rgba(239,68,68,0.08)",
            border: `1px solid ${result ? "rgba(16,185,129,0.25)" : "rgba(239,68,68,0.25)"}`,
          }}
        >
          {result
            ? <CheckCircle style={{ width: 15, height: 15, color: "var(--success)", flexShrink: 0, marginTop: 1 }} />
            : <XCircle style={{ width: 15, height: 15, color: "var(--danger)", flexShrink: 0, marginTop: 1 }} />
          }
          <div>
            <p className="text-xs font-semibold" style={{ color: result ? "var(--success)" : "var(--danger)" }}>
              {result ? "PASS" : "FAIL"}
            </p>
            <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
              {result?.message || failed?.response?.data?.detail?.message || "Quality gate failed"}
            </p>
          </div>
        </div>
      )}

      {/* Curl snippet */}
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-widest mb-1.5" style={{ color: "var(--text-faint)" }}>CI/CD Usage</p>
        <CurlSnippet datasetId={datasetId} threshold={threshold} />
      </div>
    </div>
  );
}

function CurlSnippet({ datasetId, threshold }) {
  const [copied, setCopied] = useState(false);
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  const cmd = `curl -f "${base}/api/pipeline/gate/${datasetId}?min_trust_score=${threshold}"`;

  const copy = () => {
    navigator.clipboard.writeText(cmd);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg flex items-center justify-between gap-2 px-3 py-2"
      style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", fontFamily: "monospace" }}>
      <span className="text-[11px] truncate" style={{ color: "var(--text-muted)" }}>{cmd}</span>
      <button onClick={copy} title="Copy" style={{ color: "var(--text-faint)", flexShrink: 0 }}>
        <Copy style={{ width: 12, height: 12 }} />
      </button>
      {copied && <span className="text-[10px]" style={{ color: "var(--success)" }}>Copied!</span>}
    </div>
  );
}

function WebhooksSection() {
  const { data: webhooks = [], isLoading } = useWebhooks();
  const create = useCreateWebhook();
  const del = useDeleteWebhook();
  const update = useUpdateWebhook();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", url: "", events: [], secret: "" });

  const handleCreate = () => {
    if (!form.name || !form.url) return;
    create.mutate(
      { name: form.name, url: form.url, events: form.events, secret: form.secret || undefined },
      { onSuccess: () => { setForm({ name: "", url: "", events: [], secret: "" }); setShowForm(false); } }
    );
  };

  const toggleEvent = (e) => setForm((f) => ({
    ...f,
    events: f.events.includes(e) ? f.events.filter((x) => x !== e) : [...f.events, e],
  }));

  return (
    <div className="rounded-xl p-4 space-y-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border)" }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold" style={{ color: "var(--text-primary)" }}>Webhooks</p>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--text-muted)" }}>
            POST to your URL when events fire (scan complete, alert, contract violation).
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold"
          style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}
        >
          <Plus style={{ width: 11, height: 11 }} />
          Add
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg p-3 space-y-3" style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
          <input placeholder="Name (e.g. Slack alerts)"
            value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <input placeholder="https://hooks.example.com/..."
            value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <input placeholder="Secret (optional, for HMAC signing)"
            value={form.secret} onChange={(e) => setForm((f) => ({ ...f, secret: e.target.value }))}
            className="w-full text-xs px-3 py-2 rounded-lg outline-none"
            style={{ background: "var(--bg-card)", border: "1px solid var(--border)", color: "var(--text-primary)" }} />
          <div>
            <p className="text-[10px] mb-1.5" style={{ color: "var(--text-faint)" }}>Events (leave empty for all):</p>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((ev) => (
                <button key={ev} onClick={() => toggleEvent(ev)}
                  className="text-[10px] px-2 py-1 rounded font-medium"
                  style={{
                    background: form.events.includes(ev) ? "var(--accent-bg)" : "var(--bg-hover)",
                    color: form.events.includes(ev) ? "var(--accent-light)" : "var(--text-faint)",
                    border: `1px solid ${form.events.includes(ev) ? "var(--accent-border)" : "var(--border)"}`,
                  }}>
                  {ev}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} disabled={create.isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg, var(--accent), #4f46e5)" }}>
              {create.isPending ? "Saving..." : "Save"}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: "var(--text-muted)" }}>Cancel</button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="h-12 shimmer rounded-lg" />
      ) : webhooks.length === 0 ? (
        <p className="text-xs text-center py-4" style={{ color: "var(--text-faint)" }}>No webhooks configured</p>
      ) : (
        <div className="space-y-2">
          {webhooks.map((hook) => (
            <div key={hook.id} className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
              style={{ background: "var(--bg-hover)", border: "1px solid var(--border)" }}>
              <div className="min-w-0">
                <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>{hook.name}</p>
                <p className="text-[10px] truncate" style={{ color: "var(--text-faint)" }}>{hook.url}</p>
                {hook.events.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {hook.events.map((e) => (
                      <span key={e} className="text-[9px] px-1.5 py-0.5 rounded"
                        style={{ background: "var(--accent-bg)", color: "var(--accent-light)" }}>{e}</span>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <button onClick={() => update.mutate({ id: hook.id, is_active: !hook.is_active })}
                  title={hook.is_active ? "Disable" : "Enable"}>
                  {hook.is_active
                    ? <ToggleRight style={{ width: 18, height: 18, color: "var(--success)" }} />
                    : <ToggleLeft style={{ width: 18, height: 18, color: "var(--text-faint)" }} />
                  }
                </button>
                <button onClick={() => del.mutate(hook.id)}
                  style={{ color: "var(--text-faint)" }}
                  onMouseEnter={(e) => e.currentTarget.style.color = "var(--danger)"}
                  onMouseLeave={(e) => e.currentTarget.style.color = "var(--text-faint)"}>
                  <Trash2 style={{ width: 12, height: 12 }} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function PipelineTab({ datasetId }) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>Pipeline API</h3>
        <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
          Integrate CleanOps AI into your data pipelines and CI/CD workflows.
        </p>
      </div>
      <GateSection datasetId={datasetId} />
      <WebhooksSection />
    </div>
  );
}

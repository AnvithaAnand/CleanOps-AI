import { useState } from "react";
import { Link } from "react-router-dom";
import { FileSpreadsheet, Rows3, Columns3, Clock, AlertTriangle, Trash2, Tag, X, Plus } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import TrustScoreBadge from "./TrustScoreBadge";
import { formatDate, formatNumber } from "../../lib/utils";
import { deleteDataset } from "../../api/datasets";
import { useUpdateCatalog } from "../../hooks/useDatasets";
import client from "../../api/client";

const statusConfig = {
  uploaded:  { color: "var(--text-muted)",   bg: "var(--bg-hover)",          label: "Uploaded" },
  profiling: { color: "#3b82f6",             bg: "rgba(59,130,246,0.1)",     label: "Profiling..." },
  profiled:  { color: "var(--accent)",       bg: "var(--accent-bg)",         label: "Profiled" },
  validated: { color: "var(--success)",      bg: "rgba(16,185,129,0.1)",     label: "Validated" },
  error:     { color: "var(--danger)",       bg: "rgba(239,68,68,0.1)",      label: "Error" },
};

function parseTags(raw) {
  try { return JSON.parse(raw || "[]"); } catch { return []; }
}

export default function DatasetCard({ dataset }) {
  const status = statusConfig[dataset.status] || statusConfig.uploaded;
  const isProcessing = ["uploaded", "profiling"].includes(dataset.status);
  const [confirming, setConfirming] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const qc = useQueryClient();
  const updateCatalog = useUpdateCatalog(dataset.id);
  const tags = parseTags(dataset.tags);

  const deleteMutation = useMutation({
    mutationFn: () => deleteDataset(dataset.id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["datasets"] }),
  });

  const handleDelete = (e) => {
    e.preventDefault(); e.stopPropagation();
    if (!confirming) { setConfirming(true); return; }
    deleteMutation.mutate();
  };

  const handleCancelDelete = (e) => { e.preventDefault(); e.stopPropagation(); setConfirming(false); };

  const addTag = (e) => {
    e.preventDefault(); e.stopPropagation();
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || tags.includes(t)) { setTagInput(""); return; }
    updateCatalog.mutate({ tags: [...tags, t] });
    setTagInput("");
  };

  const removeTag = (e, tag) => {
    e.preventDefault(); e.stopPropagation();
    updateCatalog.mutate({ tags: tags.filter((t) => t !== tag) });
  };

  return (
    <Link
      to={`/dataset/${dataset.id}`}
      className="block rounded-xl p-5 transition-all duration-200 group relative"
      style={{ background: "var(--bg-card)", border: `1px solid var(--border)`, textDecoration: "none" }}
      onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--border-strong)"; e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)"; }}
      onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "none"; setConfirming(false); }}
    >
      {/* Top */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "var(--accent-bg)", border: `1px solid var(--accent-border)` }}>
            <FileSpreadsheet style={{ width: 18, height: 18, color: "var(--accent)" }} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm truncate max-w-[140px]" style={{ color: "var(--text-primary)" }}>
              {dataset.name}
            </h3>
            <p className="text-xs mt-0.5 truncate max-w-[140px]" style={{ color: "var(--text-faint)" }}>
              {dataset.original_filename}
            </p>
          </div>
        </div>
        <TrustScoreBadge score={dataset.trust_score} />
      </div>

      {/* Tags */}
      <div className="mb-3 min-h-[22px]" onClick={(e) => e.preventDefault()}>
        <div className="flex flex-wrap items-center gap-1">
          {tags.map((tag) => (
            <span key={tag} className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
              style={{ background: "var(--accent-bg)", color: "var(--accent-light)", border: "1px solid var(--accent-border)" }}>
              #{tag}
              <button onClick={(e) => removeTag(e, tag)} className="opacity-60 hover:opacity-100">
                <X style={{ width: 8, height: 8 }} />
              </button>
            </span>
          ))}
          {editingTags ? (
            <form onSubmit={addTag} className="flex items-center gap-1">
              <input
                autoFocus
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onBlur={() => { setEditingTags(false); setTagInput(""); }}
                placeholder="add tag…"
                className="text-[10px] px-2 py-0.5 rounded-full outline-none w-20"
                style={{ background: "var(--bg-hover)", border: "1px solid var(--border)", color: "var(--text-primary)" }}
              />
            </form>
          ) : (
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingTags(true); }}
              className="opacity-0 group-hover:opacity-60 hover:!opacity-100 w-5 h-5 flex items-center justify-center rounded-full transition-all"
              style={{ border: "1px dashed var(--border)", color: "var(--text-faint)" }}
              title="Add tag"
            >
              <Plus style={{ width: 9, height: 9 }} />
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        {[
          { icon: Rows3,    val: `${formatNumber(dataset.row_count)} rows` },
          { icon: Columns3, val: `${formatNumber(dataset.column_count)} cols` },
          { icon: Clock,    val: formatDate(dataset.created_at).split(",")[0] },
        ].map(({ icon: Icon, val }, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <Icon style={{ width: 11, height: 11, color: "var(--text-faint)", flexShrink: 0 }} />
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>{val}</span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full"
            style={{ background: status.bg, color: status.color }}>
            {isProcessing && <span className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: status.color }} />}
            {status.label}
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded uppercase"
            style={{ background: "var(--bg-hover)", color: "var(--text-faint)" }}>
            {dataset.file_type}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {dataset.trust_score != null && dataset.trust_score < 80 && !confirming && (
            <div className="flex items-center gap-1">
              <AlertTriangle style={{ width: 11, height: 11, color: "var(--warning)" }} />
              <span className="text-[11px]" style={{ color: "var(--warning)" }}>Needs attention</span>
            </div>
          )}
          {confirming ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.preventDefault()}>
              <span className="text-[11px]" style={{ color: "var(--danger)" }}>Delete?</span>
              <button onClick={handleDelete} className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ background: "rgba(239,68,68,0.15)", color: "var(--danger)" }}>Yes</button>
              <button onClick={handleCancelDelete} className="text-[11px] font-semibold px-2 py-0.5 rounded"
                style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>No</button>
            </div>
          ) : (
            <button onClick={handleDelete} title="Delete dataset"
              className="opacity-0 group-hover:opacity-100 w-6 h-6 flex items-center justify-center rounded transition-all"
              style={{ color: "var(--text-faint)" }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--danger)"; e.currentTarget.style.background = "rgba(239,68,68,0.1)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-faint)"; e.currentTarget.style.background = "transparent"; }}>
              <Trash2 style={{ width: 12, height: 12 }} />
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

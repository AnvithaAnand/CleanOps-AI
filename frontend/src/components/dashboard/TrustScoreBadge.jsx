export default function TrustScoreBadge({ score }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
        style={{ background: "var(--bg-hover)", color: "var(--text-muted)" }}>
        Pending
      </span>
    );
  }

  const r = Math.round(score);
  let color, bg, border;
  if (r >= 90)      { color = "#10b981"; bg = "rgba(16,185,129,0.12)";  border = "rgba(16,185,129,0.25)"; }
  else if (r >= 75) { color = "#22d3ee"; bg = "rgba(34,211,238,0.1)";   border = "rgba(34,211,238,0.2)"; }
  else if (r >= 60) { color = "#f59e0b"; bg = "rgba(245,158,11,0.1)";   border = "rgba(245,158,11,0.2)"; }
  else if (r >= 40) { color = "#f97316"; bg = "rgba(249,115,22,0.1)";   border = "rgba(249,115,22,0.2)"; }
  else              { color = "#ef4444"; bg = "rgba(239,68,68,0.1)";    border = "rgba(239,68,68,0.2)"; }

  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold"
      style={{ background: bg, color, border: `1px solid ${border}` }}>
      {r}
    </span>
  );
}

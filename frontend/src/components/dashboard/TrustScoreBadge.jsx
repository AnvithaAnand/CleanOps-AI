export default function TrustScoreBadge({ score }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold"
        style={{ background: "var(--bg-hover)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>
        Pending
      </span>
    );
  }

  const r = Math.round(score);
  let color, bg, border, glow;
  if (r >= 90)      { color = "#34d399"; bg = "rgba(52,211,153,0.12)";  border = "rgba(52,211,153,0.25)"; glow = "0 0 12px rgba(52,211,153,0.2)"; }
  else if (r >= 75) { color = "#22d3ee"; bg = "rgba(34,211,238,0.1)";   border = "rgba(34,211,238,0.2)";  glow = "0 0 12px rgba(34,211,238,0.15)"; }
  else if (r >= 60) { color = "#fbbf24"; bg = "rgba(251,191,36,0.1)";   border = "rgba(251,191,36,0.2)";  glow = "0 0 12px rgba(251,191,36,0.15)"; }
  else if (r >= 40) { color = "#fb923c"; bg = "rgba(251,146,60,0.1)";   border = "rgba(251,146,60,0.2)";  glow = "0 0 12px rgba(251,146,60,0.15)"; }
  else              { color = "#f87171"; bg = "rgba(248,113,113,0.1)";  border = "rgba(248,113,113,0.2)"; glow = "0 0 12px rgba(248,113,113,0.15)"; }

  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold"
      style={{ background: bg, color, border: `1px solid ${border}`, boxShadow: glow }}>
      <svg width="10" height="10" viewBox="0 0 16 16" fill="none">
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2" strokeDasharray={`${(r / 100) * 37.7} 37.7`}
          strokeLinecap="round" transform="rotate(-90 8 8)" opacity="0.8" />
        <circle cx="8" cy="8" r="6" stroke={color} strokeWidth="2" opacity="0.15" />
      </svg>
      {r}
    </span>
  );
}

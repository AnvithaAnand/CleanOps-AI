import { cn, getTrustScoreBg } from "../../lib/utils";

export default function TrustScoreBadge({ score }) {
  if (score == null) {
    return (
      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
        Pending
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold",
        getTrustScoreBg(score)
      )}
    >
      {Math.round(score)}
    </span>
  );
}

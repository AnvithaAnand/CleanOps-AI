import { useQuery } from "@tanstack/react-query";
import { getTrustScore } from "../api/datasets";

export function useTrustScore(datasetId) {
  return useQuery({
    queryKey: ["trustScore", datasetId],
    queryFn: () => getTrustScore(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

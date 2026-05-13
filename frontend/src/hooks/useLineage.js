import { useQuery } from "@tanstack/react-query";
import { getLineage } from "../api/lineage";

export function useLineage(datasetId) {
  return useQuery({
    queryKey: ["lineage", datasetId],
    queryFn: () => getLineage(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

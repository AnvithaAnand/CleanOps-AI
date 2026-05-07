import { useQuery } from "@tanstack/react-query";
import { getIssues } from "../api/datasets";

export function useIssues(datasetId, filters = {}) {
  return useQuery({
    queryKey: ["issues", datasetId, filters],
    queryFn: () => getIssues(datasetId, filters).then((r) => r.data),
    enabled: !!datasetId,
  });
}

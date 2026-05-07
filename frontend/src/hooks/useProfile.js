import { useQuery } from "@tanstack/react-query";
import { getProfile } from "../api/datasets";

export function useProfile(datasetId) {
  return useQuery({
    queryKey: ["profile", datasetId],
    queryFn: () => getProfile(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

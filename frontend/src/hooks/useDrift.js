import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getDrift, resetBaseline } from "../api/drift";

export function useDrift(datasetId) {
  return useQuery({
    queryKey: ["drift", datasetId],
    queryFn: () => getDrift(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

export function useResetBaseline(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => resetBaseline(datasetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["drift", datasetId] }),
  });
}

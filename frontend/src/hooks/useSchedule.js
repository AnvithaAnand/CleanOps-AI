import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getSchedule, removeSchedule, setSchedule } from "../api/schedules";

export function useSchedule(datasetId) {
  return useQuery({
    queryKey: ["schedule", datasetId],
    queryFn: () => getSchedule(datasetId),
    enabled: !!datasetId,
  });
}

export function useSetSchedule(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ frequency, is_active }) => setSchedule(datasetId, frequency, is_active),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", datasetId] }),
  });
}

export function useRemoveSchedule(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => removeSchedule(datasetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["schedule", datasetId] }),
  });
}

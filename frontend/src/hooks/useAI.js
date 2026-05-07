import { useQuery, useMutation } from "@tanstack/react-query";
import { getAISummary, getAIExplainIssues, postNLCommand, getCleaningCode } from "../api/ai";

export function useAISummary(datasetId, enabled = true) {
  return useQuery({
    queryKey: ["ai-summary", datasetId],
    queryFn: () => getAISummary(datasetId).then((r) => r.data),
    enabled: !!datasetId && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useAIExplainIssues(datasetId, enabled = true) {
  return useQuery({
    queryKey: ["ai-explain-issues", datasetId],
    queryFn: () => getAIExplainIssues(datasetId).then((r) => r.data),
    enabled: !!datasetId && enabled,
    staleTime: 60_000,
    retry: false,
  });
}

export function useCleaningCode(datasetId, enabled = false) {
  return useQuery({
    queryKey: ["cleaning-code", datasetId],
    queryFn: () => getCleaningCode(datasetId).then((r) => r.data),
    enabled: !!datasetId && enabled,
    staleTime: 30_000,
    retry: false,
  });
}

export function useNLCommand(datasetId) {
  return useMutation({
    mutationFn: (command) =>
      postNLCommand(datasetId, command).then((r) => r.data),
  });
}

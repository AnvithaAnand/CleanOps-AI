import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createWebhook, deleteWebhook, listWebhooks, qualityGate, updateWebhook } from "../api/pipeline";

export function useWebhooks() {
  return useQuery({ queryKey: ["webhooks"], queryFn: listWebhooks });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createWebhook,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useUpdateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...body }) => updateWebhook(id, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteWebhook,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["webhooks"] }),
  });
}

export function useQualityGate(datasetId, threshold) {
  return useMutation({
    mutationFn: () => qualityGate(datasetId, threshold),
  });
}

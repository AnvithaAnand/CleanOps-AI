import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listWebhooks, listWebhookEvents,
  createWebhook, toggleWebhook, testWebhook, deleteWebhook,
} from "../api/webhooks";

const QK = ["webhooks"];

export function useWebhooks() {
  return useQuery({ queryKey: QK, queryFn: () => listWebhooks().then((r) => r.data) });
}

export function useWebhookEvents() {
  return useQuery({
    queryKey: ["webhookEvents"],
    queryFn: () => listWebhookEvents().then((r) => r.data),
    staleTime: Infinity,
  });
}

export function useCreateWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createWebhook(body).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useToggleWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }) => toggleWebhook(id, is_active).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

export function useTestWebhook() {
  return useMutation({
    mutationFn: (id) => testWebhook(id).then((r) => r.data),
  });
}

export function useDeleteWebhook() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteWebhook(id).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: QK }),
  });
}

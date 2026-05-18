import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteAlert, deleteRule, listAlerts, listRules, markRead, toggleRule, unreadCount, createRule } from "../api/alerts";

export function useAlerts(params) {
  return useQuery({
    queryKey: ["alerts", params],
    queryFn: () => listAlerts(params).then((r) => r.data),
    refetchInterval: 15000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["alerts-unread"],
    queryFn: () => unreadCount().then((r) => r.data.count),
    refetchInterval: 10000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (params) => markRead(params),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-unread"] });
    },
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteAlert(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-unread"] });
    },
  });
}

export function useAlertRules() {
  return useQuery({
    queryKey: ["alert-rules"],
    queryFn: () => listRules().then((r) => r.data),
  });
}

export function useCreateRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => createRule(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useToggleRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => toggleRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

export function useDeleteRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRule(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alert-rules"] }),
  });
}

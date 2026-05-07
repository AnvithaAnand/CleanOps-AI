import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { listRules, createRule, deleteRule } from "../api/rules";

export function useRules(params) {
  return useQuery({
    queryKey: ["rules", params],
    queryFn: () => listRules(params).then((r) => r.data),
  });
}

export function useCreateRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => createRule(data).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });
}

export function useDeleteRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => deleteRule(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["rules"] }),
  });
}

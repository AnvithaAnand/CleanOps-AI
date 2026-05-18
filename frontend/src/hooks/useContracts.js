import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { deleteContract, getContract, upsertContract, validateContract } from "../api/contracts";

export function useContract(datasetId) {
  return useQuery({
    queryKey: ["contract", datasetId],
    queryFn: () => getContract(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

export function useUpsertContract(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => upsertContract(datasetId, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", datasetId] }),
  });
}

export function useDeleteContract(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => deleteContract(datasetId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contract", datasetId] }),
  });
}

export function useValidateContract(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => validateContract(datasetId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contract", datasetId] });
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["alerts-unread"] });
    },
  });
}

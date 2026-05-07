import { useQuery } from "@tanstack/react-query";
import { getAuditLog, getVersions } from "../api/datasets";

export function useAuditLog(datasetId) {
  return useQuery({
    queryKey: ["audit", datasetId],
    queryFn: () => getAuditLog(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

export function useVersions(datasetId) {
  return useQuery({
    queryKey: ["versions", datasetId],
    queryFn: () => getVersions(datasetId).then((r) => r.data),
    enabled: !!datasetId,
  });
}

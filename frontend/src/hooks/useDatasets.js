import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  listDatasets,
  getDataset,
  uploadDataset,
  applyRepairs,
  downloadDataset,
  previewData,
  deleteDataset,
} from "../api/datasets";
import client from "../api/client";

export function useUpdateCatalog(datasetId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body) => client.patch(`/api/datasets/${datasetId}/catalog`, body).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["datasets"] });
      qc.invalidateQueries({ queryKey: ["dataset", datasetId] });
    },
  });
}

export function useDatasets(params) {
  return useQuery({
    queryKey: ["datasets", params],
    queryFn: () => listDatasets(params).then((r) => r.data),
  });
}

export function useDataset(id) {
  return useQuery({
    queryKey: ["dataset", id],
    queryFn: () => getDataset(id).then((r) => r.data),
    enabled: !!id,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (data && ["uploaded", "profiling", "profiled"].includes(data.status)) return 2000;
      return false;
    },
  });
}

export function useUploadDataset() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (formData) => uploadDataset(formData).then((r) => r.data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["datasets"] }),
  });
}

export function useApplyRepairs(datasetId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (suggestionIds) =>
      applyRepairs(datasetId, suggestionIds).then((r) => r.data),
    onSuccess: () => {
      const refetchAll = () => {
        queryClient.invalidateQueries({ queryKey: ["dataset", datasetId] });
        queryClient.invalidateQueries({ queryKey: ["issues", datasetId] });
        queryClient.invalidateQueries({ queryKey: ["trustScore", datasetId] });
        queryClient.invalidateQueries({ queryKey: ["versions", datasetId] });
        queryClient.invalidateQueries({ queryKey: ["audit", datasetId] });
      };
      refetchAll();
      setTimeout(refetchAll, 3000);
      setTimeout(refetchAll, 8000);
      setTimeout(refetchAll, 15000);
    },
  });
}

export function useDownloadDataset() {
  return useMutation({
    mutationFn: ({ id, version }) => downloadDataset(id, version),
    onSuccess: (response, { name }) => {
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.download = `${name || "dataset"}_cleaned.csv`;
      link.click();
      window.URL.revokeObjectURL(url);
    },
  });
}

export function usePreviewData(id, rows = 100) {
  return useQuery({
    queryKey: ["preview", id, rows],
    queryFn: () => previewData(id, rows).then((r) => r.data),
    enabled: !!id,
  });
}

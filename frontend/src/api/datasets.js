import client from "./client";

export const uploadDataset = (formData) =>
  client.post("/api/datasets/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const listDatasets = (params) =>
  client.get("/api/datasets", { params });

export const getDataset = (id) =>
  client.get(`/api/datasets/${id}`);

export const getProfile = (id) =>
  client.get(`/api/datasets/${id}/profile`);

export const getIssues = (id, params) =>
  client.get(`/api/datasets/${id}/issues`, { params });

export const applyRepairs = (id, suggestionIds) =>
  client.post(`/api/datasets/${id}/repair`, { suggestion_ids: suggestionIds });

export const getVersions = (id) =>
  client.get(`/api/datasets/${id}/versions`);

export const getAuditLog = (id) =>
  client.get(`/api/datasets/${id}/audit`);

export const getTrustScore = (id) =>
  client.get(`/api/datasets/${id}/trust-score`);

export const runValidation = (id, ruleIds) =>
  client.post(`/api/datasets/${id}/validate`, { rule_ids: ruleIds });

export const downloadDataset = (id, version) =>
  client.get(`/api/datasets/${id}/download`, {
    params: { version },
    responseType: "blob",
  });

export const previewData = (id, rows = 100) =>
  client.get(`/api/datasets/${id}/preview`, { params: { rows } });

export const importFromUrl = (body) =>
  client.post("/api/datasets/import/url", body);

export const importFromGoogleSheets = (body) =>
  client.post("/api/datasets/import/google-sheets", body);

export const importFromPostgresql = (body) =>
  client.post("/api/datasets/import/postgresql", body);

export const deleteDataset = (id) =>
  client.delete(`/api/datasets/${id}`);

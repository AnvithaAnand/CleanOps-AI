import client from "./client";

export const qualityGate = (datasetId, minTrustScore = 80) =>
  client.get(`/api/pipeline/gate/${datasetId}`, { params: { min_trust_score: minTrustScore } });

export const listWebhooks = () =>
  client.get("/api/pipeline/webhooks").then((r) => r.data);

export const createWebhook = (body) =>
  client.post("/api/pipeline/webhooks", body).then((r) => r.data);

export const updateWebhook = (id, body) =>
  client.patch(`/api/pipeline/webhooks/${id}`, body).then((r) => r.data);

export const deleteWebhook = (id) =>
  client.delete(`/api/pipeline/webhooks/${id}`);

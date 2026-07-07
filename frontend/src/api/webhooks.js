import client from "./client";

export const listWebhooks    = ()         => client.get("/api/webhooks/");
export const listWebhookEvents = ()       => client.get("/api/webhooks/events");
export const createWebhook   = (body)     => client.post("/api/webhooks/", body);
export const toggleWebhook   = (id, is_active) => client.put(`/api/webhooks/${id}/toggle`, { is_active });
export const testWebhook     = (id)       => client.post(`/api/webhooks/${id}/test`);
export const deleteWebhook   = (id)       => client.delete(`/api/webhooks/${id}`);

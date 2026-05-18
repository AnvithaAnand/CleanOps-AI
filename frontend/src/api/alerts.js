import client from "./client";

export const listAlerts  = (params) => client.get("/api/alerts", { params });
export const unreadCount = ()       => client.get("/api/alerts/unread-count");
export const markRead    = (params) => client.post("/api/alerts/mark-read", null, { params });
export const deleteAlert = (id)     => client.delete(`/api/alerts/${id}`);

export const listRules   = ()       => client.get("/api/alerts/rules");
export const createRule  = (body)   => client.post("/api/alerts/rules", body);
export const toggleRule  = (id)     => client.patch(`/api/alerts/rules/${id}`);
export const deleteRule  = (id)     => client.delete(`/api/alerts/rules/${id}`);

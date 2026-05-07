import client from "./client";

export const createRule = (data) =>
  client.post("/api/rules", data);

export const listRules = (params) =>
  client.get("/api/rules", { params });

export const updateRule = (id, data) =>
  client.put(`/api/rules/${id}`, data);

export const deleteRule = (id) =>
  client.delete(`/api/rules/${id}`);

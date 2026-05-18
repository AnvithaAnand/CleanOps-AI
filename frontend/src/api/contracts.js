import client from "./client";

export const getContract      = (id)       => client.get(`/api/datasets/${id}/contract`);
export const upsertContract   = (id, body) => client.post(`/api/datasets/${id}/contract`, body);
export const deleteContract   = (id)       => client.delete(`/api/datasets/${id}/contract`);
export const validateContract = (id)       => client.post(`/api/datasets/${id}/contract/validate`);

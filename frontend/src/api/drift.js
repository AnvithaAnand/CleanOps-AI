import client from "./client";

export const getDrift = (id) => client.get(`/api/datasets/${id}/drift`);
export const resetBaseline = (id) => client.post(`/api/datasets/${id}/baseline/reset`);

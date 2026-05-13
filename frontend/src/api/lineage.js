import client from "./client";

export const getLineage = (id) => client.get(`/api/datasets/${id}/lineage`);

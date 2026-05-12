import client from "./client";

export const listJobs = (params) => client.get("/api/jobs", { params });
export const getJob = (id) => client.get(`/api/jobs/${id}`);

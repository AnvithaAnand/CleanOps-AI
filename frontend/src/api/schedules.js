import client from "./client";

export const getSchedule = (datasetId) =>
  client.get(`/api/schedules/${datasetId}`).then((r) => r.data);

export const setSchedule = (datasetId, frequency, is_active = true) =>
  client.put(`/api/schedules/${datasetId}`, { frequency, is_active }).then((r) => r.data);

export const removeSchedule = (datasetId) =>
  client.delete(`/api/schedules/${datasetId}`);

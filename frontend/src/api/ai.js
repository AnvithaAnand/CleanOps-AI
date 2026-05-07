import client from "./client";

export const getAISummary = (id) =>
  client.get(`/api/ai/${id}/summary`);

export const getAIExplainIssues = (id) =>
  client.get(`/api/ai/${id}/explain-issues`);

export const postNLCommand = (id, command) =>
  client.post(`/api/ai/${id}/nl-command`, { command });

export const getCleaningCode = (id) =>
  client.get(`/api/ai/${id}/cleaning-code`);

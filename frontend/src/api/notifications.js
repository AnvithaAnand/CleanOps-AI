import client from "./client";

export const getNotificationSettings = () =>
  client.get("/api/notifications/settings").then((r) => r.data);

export const updateNotificationSettings = (body) =>
  client.put("/api/notifications/settings", body).then((r) => r.data);

export const sendTestNotification = () =>
  client.post("/api/notifications/test").then((r) => r.data);

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getNotificationSettings,
  sendTestNotification,
  updateNotificationSettings,
} from "../api/notifications";

export function useNotificationSettings() {
  return useQuery({
    queryKey: ["notification-settings"],
    queryFn: getNotificationSettings,
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateNotificationSettings,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notification-settings"] }),
  });
}

export function useSendTestNotification() {
  return useMutation({ mutationFn: sendTestNotification });
}

import { API_BASE_URL } from "@/config/api";

const NOTIFICATIONS_BASE_URL = `${API_BASE_URL}/api/Notifications`;

export const NOTIFICATIONS_ENDPOINTS = {
  byUser: (userId: number, unreadOnly?: boolean) => {
    const params = new URLSearchParams();
    if (unreadOnly) params.set("unreadOnly", "true");
    const qs = params.toString();
    return `${NOTIFICATIONS_BASE_URL}/user/${userId}${qs ? `?${qs}` : ""}`;
  },
  unreadCount: (userId: number) =>
    `${NOTIFICATIONS_BASE_URL}/user/${userId}/unread-count`,
  markAsRead: (id: number) => `${NOTIFICATIONS_BASE_URL}/${id}/read`,
  markAllAsRead: (userId: number) =>
    `${NOTIFICATIONS_BASE_URL}/user/${userId}/read-all`,
  delete: (id: number) => `${NOTIFICATIONS_BASE_URL}/${id}`,
} as const;

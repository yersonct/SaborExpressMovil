import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { NOTIFICATIONS_ENDPOINTS } from "./notificationEndpoints";
import type { NotificationApiResponse } from "../types/notification.types";

export const notificationService = {
  getByUser: async (
    userId: number,
    unreadOnly?: boolean,
  ): Promise<NotificationApiResponse[]> => {
    const res = await fetchAuthed(
      NOTIFICATIONS_ENDPOINTS.byUser(userId, unreadOnly),
    );
    return handleResponse<NotificationApiResponse[]>(res);
  },

  getUnreadCount: async (userId: number): Promise<number> => {
    const res = await fetchAuthed(NOTIFICATIONS_ENDPOINTS.unreadCount(userId));
    const data = await handleResponse<{ unreadCount: number }>(res);
    return data.unreadCount;
  },

  markAllAsRead: async (userId: number): Promise<void> => {
    const res = await fetchAuthed(
      NOTIFICATIONS_ENDPOINTS.markAllAsRead(userId),
      { method: "PATCH" },
    );
    await handleResponse(res);
  },

  delete: async (id: number): Promise<void> => {
    const res = await fetchAuthed(NOTIFICATIONS_ENDPOINTS.delete(id), {
      method: "DELETE",
    });
    await handleResponse(res);
  },
};

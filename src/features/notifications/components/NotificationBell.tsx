import React from "react";
import { NotificationCenter } from "@/features/shared/components/NotificationCenter";
import type { ToastNotification } from "@/features/shared/components/NotificationToast";
import { useUserNotifications } from "../context/UserNotificationsContext";

export function NotificationBell({
  onSelect,
}: {
  onSelect?: (n: ToastNotification) => void;
}) {
  const { history, unreadCount, markAllRead, clear } = useUserNotifications();
  return (
    <NotificationCenter
      notifications={history}
      unreadCount={unreadCount}
      onOpen={markAllRead}
      onClear={clear}
      onSelect={onSelect}
    />
  );
}

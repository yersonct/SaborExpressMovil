import React from "react";
import { NotificationCenter } from "@/features/shared/components/NotificationCenter";
import type { ToastNotification } from "@/features/shared/components/NotificationToast";
import { useUserNotifications } from "../context/UserNotificationsContext";
import { useOptionalClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";

type NotificationThemeColors = {
  background: string;
  surface: string;
  elevated: string;
  text: string;
  muted: string;
  border: string;
  accent: string;
};

export function NotificationBell({
  onSelect,
  colors: themeColors,
  t: translate,
}: {
  onSelect?: (n: ToastNotification) => void;
  colors?: NotificationThemeColors;
  t?: (key: string) => string;
}) {
  const { history, unreadCount, markAllRead, clear, openRelatedOrder } = useUserNotifications();
  const preferences = useOptionalClientPreferences();
  return (
    <NotificationCenter
      notifications={history}
      colors={themeColors ?? preferences?.colors}
      t={translate ?? preferences?.t}
      unreadCount={unreadCount}
      onOpen={markAllRead}
      onClear={clear}
      onSelect={onSelect ?? openRelatedOrder}
    />
  );
}

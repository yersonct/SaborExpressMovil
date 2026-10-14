import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
import { useWaiterNotificationPreferences } from "@/features/waiter/context/WaiterNotificationPreferencesContext";
import { vibrateWaiterDevice } from "@/features/waiter/services/waiterVibration";
import {
  DELIVERIES_CHANGED,
  ORDERS_CHANGED,
  PAYMENTS_CHANGED,
  REALTIME_CONNECTED,
  RECEIVE_NOTIFICATION,
  TABLES_CHANGED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";

const notifySound = require("../../../../assets/sounds/notify.wav");
const kitchenNotifySound = require("../../../../assets/sounds/kitchen-notify.wav");
const REFRESH_DEBOUNCE_MS = 80;

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

interface KitchenNotification {
  id: number;
  title: string;
  message: string;
  type: string | number;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt?: string;
  isRead?: boolean;
}

export function useKitchenNotifications(
  onNotification?: (n: KitchenNotification) => void,
  onRefresh?: () => void,
) {
  const notificationPreferences = useWaiterNotificationPreferences();
  const notificationPreferencesRef = useRef(notificationPreferences);
  notificationPreferencesRef.current = notificationPreferences;
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const onNotificationRef = useRef(onNotification);
  onNotificationRef.current = onNotification;
  const waiterPlayer = useAudioPlayer(notifySound);
  const kitchenPlayer = useAudioPlayer(kitchenNotifySound);
  const waiterPlayerRef = useRef(waiterPlayer);
  const kitchenPlayerRef = useRef(kitchenPlayer);
  waiterPlayerRef.current = waiterPlayer;
  kitchenPlayerRef.current = kitchenPlayer;
  const [soundEnabled, setSoundEnabled] = useState(Platform.OS !== "web");
  const soundEnabledRef = useRef(soundEnabled);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const enableSound = () => {
    try {
      waiterPlayerRef.current.seekTo(0);
      waiterPlayerRef.current.play();
      if (!notificationPreferencesRef.current.isWaiterPanel) {
        kitchenPlayerRef.current.seekTo(0);
        kitchenPlayerRef.current.play();
      }
      setSoundEnabled(true);
    } catch (error) {
      console.log("[DEBUG] No se pudo desbloquear el sonido:", error);
    }
  };

  useEffect(() => {
    let refreshTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      refreshTimer = setTimeout(() => {
        refreshTimer = null;
        onRefreshRef.current?.();
      }, REFRESH_DEBOUNCE_MS);
    };

    const unsubscribeNotification = subscribeRealtimeEvent(
      RECEIVE_NOTIFICATION,
      (raw) => {
        if (!raw || typeof raw !== "object") return;
        const notification = raw as KitchenNotification;
        const normalizedType = normalizeNotificationType(notification.type);
        const isWaiterAlert =
          normalizedType === "OrderReady" || normalizedType === "TableAvailable";
        const preferences = notificationPreferencesRef.current;
        const shouldPlaySound = preferences.isWaiterPanel
          ? isWaiterAlert && preferences.hydrated && preferences.soundNotifications
          : true;

        if (soundEnabledRef.current && shouldPlaySound) {
          const playerToUse = isWaiterAlert
            ? waiterPlayerRef.current
            : normalizedType === "OrderCreated"
              ? kitchenPlayerRef.current
              : null;
          if (playerToUse) {
            try {
              playerToUse.seekTo(0);
              playerToUse.play();
            } catch {
              // Un fallo de audio no debe interrumpir los eventos.
            }
          }
        }
        if (
          preferences.isWaiterPanel &&
          isWaiterAlert &&
          preferences.hydrated &&
          preferences.vibrationNotifications &&
          Platform.OS !== "web"
        ) {
          vibrateWaiterDevice();
        }

        if (notification.relatedEntityType?.toLowerCase() === "order") {
          scheduleRefresh();
        }
        onNotificationRef.current?.({ ...notification, type: normalizedType });
      },
    );
    const unsubscribeDataEvents = [
      ORDERS_CHANGED,
      TABLES_CHANGED,
      DELIVERIES_CHANGED,
      PAYMENTS_CHANGED,
      REALTIME_CONNECTED,
    ].map((eventName) => subscribeRealtimeEvent(eventName, scheduleRefresh));

    return () => {
      if (refreshTimer) clearTimeout(refreshTimer);
      unsubscribeNotification();
      unsubscribeDataEvents.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return { soundEnabled, enableSound };
}

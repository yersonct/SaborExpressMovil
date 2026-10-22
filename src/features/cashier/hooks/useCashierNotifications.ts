import { useEffect, useRef, useState } from "react";
import { Platform, Vibration } from "react-native";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
import {
  DELIVERIES_CHANGED,
  ORDERS_CHANGED,
  PAYMENTS_CHANGED,
  REALTIME_CONNECTED,
  RECEIVE_NOTIFICATION,
  TABLES_CHANGED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";

const cashierSound = require("../../../../assets/sounds/notify.wav");

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export interface CashierNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

const REFRESH_DEBOUNCE_MS = 200;

export function useCashierNotifications(
  onNotification?: (n: CashierNotification) => void,
  soundPreference: boolean = true,
  onRefresh?: () => void,
  vibrationPreference: boolean = true,
) {
  const player = useAudioPlayer(cashierSound);
  const playerRef = useRef(player);
  const [soundEnabled, setSoundEnabled] = useState(Platform.OS !== "web");
  const soundEnabledRef = useRef(soundEnabled);
  const preferenceRef = useRef(soundPreference);
  const vibrationPreferenceRef = useRef(vibrationPreference);
  const callbackRef = useRef(onNotification);
  const refreshRef = useRef(onRefresh);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    preferenceRef.current = soundPreference;
  }, [soundPreference]);
  useEffect(() => {
    vibrationPreferenceRef.current = vibrationPreference;
  }, [vibrationPreference]);
  useEffect(() => {
    playerRef.current = player;
    callbackRef.current = onNotification;
    refreshRef.current = onRefresh;
  }, [onNotification, onRefresh, player]);

  const enableSound = () => {
    try {
      playerRef.current.seekTo(0);
      playerRef.current.play();
      setSoundEnabled(true);
    } catch (error) {
      console.log("[Cajero] No se pudo desbloquear el sonido:", error);
    }
  };

  useEffect(() => {
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    const scheduleRefresh = () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      debounceTimer = setTimeout(
        () => refreshRef.current?.(),
        REFRESH_DEBOUNCE_MS,
      );
    };

    const unsubscribeNotification = subscribeRealtimeEvent(
      RECEIVE_NOTIFICATION,
      (raw) => {
        if (!raw || typeof raw !== "object") return;
        const notification = raw as CashierNotification;
        const type = normalizeNotificationType(notification.type);
        const isIncomingOrder =
          type === "OrderCreated";
        if (!isIncomingOrder && type !== "PaymentConfirmed") return;

        if (soundEnabledRef.current && preferenceRef.current) {
          try {
            playerRef.current.seekTo(0);
            playerRef.current.play();
          } catch {
            // Un fallo de audio no debe interrumpir la notificaciÃ³n.
          }
        }
        // Sonido y vibracion son preferencias INDEPENDIENTES.
        // Vibrar aunque el sonido de alertas este apagado.
        if (vibrationPreferenceRef.current && Platform.OS !== "web") {
          try {
            Vibration.cancel();
            Vibration.vibrate([0, 300, 150, 300]);
          } catch {
            // Un fallo de vibracion no debe interrumpir la notificacion.
          }
        }

        scheduleRefresh();
        callbackRef.current?.({ ...notification, type });
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
      if (debounceTimer) clearTimeout(debounceTimer);
      unsubscribeNotification();
      unsubscribeDataEvents.forEach((unsubscribe) => unsubscribe());
    };
  }, []);

  return { soundEnabled, enableSound };
}

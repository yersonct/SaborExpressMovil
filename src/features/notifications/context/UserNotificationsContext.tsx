import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Platform, StyleSheet, Vibration, View } from "react-native";
import { useRouter } from "expo-router";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { normalizeNotificationType } from "../utils/notificationType";
import { notificationService } from "../services/notificationService";
import {
  NotificationToastContainer,
  type ToastNotification,
} from "@/features/shared/components/NotificationToast";
import { AppAlertModal } from "@/features/shared/components/AppAlertModal";
import { useOptionalClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { useOptionalDeliveryNotificationPreferences } from "@/features/delivery/components/context/DeliveryContext";
import { getDeliveryTheme } from "@/features/delivery/components/context/deliveryTheme";
import { invokeRealtimeMethod } from "@/features/shared/services/realtimeEvents";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { deferEffect } from "@/features/shared/utils/deferEffect";

const notifySound = require("../../../../assets/sounds/notify.wav");

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

// Tipos que hacen sonar el celular del cliente / repartidor.
const SOUND_TYPES = new Set([
  "PaymentConfirmed",
  "DeliveryAssigned",
  "OrderStatusChanged",
  "OrderReady",
  "TableAvailable",
]);
const DELIVERY_ALERT_TYPES = new Set([
  "DeliveryAssigned",
  "OrderStatusChanged",
  "OrderReady",
]);

type Listener = (n: ToastNotification) => void;

interface UserNotificationsValue {
  history: ToastNotification[];
  unreadCount: number;
  markAllRead: () => void;
  clear: () => void;
  subscribe: (fn: Listener) => () => void;
  openRelatedOrder: (notification: ToastNotification) => void;
  reportDeliveryLocation: (latitude: number, longitude: number) => Promise<boolean>;
}

const Ctx = createContext<UserNotificationsValue | undefined>(undefined);

export function UserNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const router = useRouter();
  const clientPreferences = useOptionalClientPreferences();
  const deliveryPreferences = useOptionalDeliveryNotificationPreferences();
  const deliveryTheme = deliveryPreferences
    ? getDeliveryTheme(deliveryPreferences.isDark)
    : undefined;
  const clientSettingsRef = useRef(clientPreferences?.settings);
  const deliveryPreferencesRef = useRef(deliveryPreferences);
  const player = useAudioPlayer(notifySound);
  const playerRef = useRef(player);
  useEffect(() => {
    clientSettingsRef.current = clientPreferences?.settings;
    deliveryPreferencesRef.current = deliveryPreferences;
    playerRef.current = player;
  }, [clientPreferences?.settings, deliveryPreferences, player]);

  const [history, setHistory] = useState<ToastNotification[]>([]);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const historyRef = useRef<ToastNotification[]>([]);
  const listenersRef = useRef(new Set<Listener>());

  const userId = user?.token ? getUserIdFromToken(user.token) : null;

  useEffect(() => {
    historyRef.current = history;
  }, [history]);

  const emit = useCallback((n: ToastNotification) => {
    listenersRef.current.forEach((fn) => {
      try {
        fn(n);
      } catch {
        // un listener roto no debe afectar a los demás
      }
    });
  }, []);

  // Carga el historial del servidor (también sirve para recuperar lo que llegó
  // mientras la app estaba en segundo plano o sin conexión).
  const loadHistory = useCallback(async () => {
    if (!userId) return;
    try {
      const list = await notificationService.getByUser(userId);
      const mapped: ToastNotification[] = list.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        type: normalizeNotificationType(n.type),
        relatedEntityType: n.relatedEntityType,
        relatedEntityId: n.relatedEntityId,
      }));
      setHistory(mapped.slice(0, 50));
      setUnreadCount(list.filter((n) => !n.isRead).length);
    } catch {
      // silencioso: se reintenta en la próxima reconexión
    }
  }, [userId]);

  useEffect(() => deferEffect(() => {
    loadHistory();
  }), [loadHistory]);

  const handleRealtimeEvent = useCallback((eventName: string, ...args: unknown[]) => {
    if (eventName === "ReceiveNotification") {
      const raw = args[0] as any;
      if (!raw) return;
      const n: ToastNotification = {
        ...raw,
        type: normalizeNotificationType(raw.type),
      };

      const alreadyKnown = historyRef.current.some((p) => p.id === n.id);
      if (!alreadyKnown) {
        setHistory((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      }
      const notificationsEnabled = deliveryPreferencesRef.current
        ? deliveryPreferencesRef.current.hydrated &&
          deliveryPreferencesRef.current.pushNotifications
        : clientSettingsRef.current?.pushNotifications !== false;
      if (notificationsEnabled) {
        setToasts((prev) => [...prev, n]);
      }

      const courierPreferences = deliveryPreferencesRef.current;
      const soundEnabled = courierPreferences
        ? notificationsEnabled && courierPreferences.soundNotifications
        : clientSettingsRef.current?.soundNotifications !== false;
      if (soundEnabled && SOUND_TYPES.has(n.type)) {
        try {
          playerRef.current.seekTo(0);
          playerRef.current.play();
        } catch {
          // un fallo de audio no debe romper la notificación
        }
      }
      if (
        notificationsEnabled &&
        courierPreferences?.hydrated &&
        courierPreferences.vibrationNotifications &&
        DELIVERY_ALERT_TYPES.has(n.type) &&
        Platform.OS !== "web"
      ) {
        try {
          Vibration.cancel();
          Vibration.vibrate([0, 300, 150, 300]);
        } catch {
          // Un fallo de vibración no debe interrumpir la recepción del pedido.
        }
      }
      emit(n);
      return;
    }

    if (eventName === "DeliveryLocationUpdated") {
      const raw = args[0] as any;
      const orderId = Number(raw?.orderId);
      const deliveryId = Number(raw?.deliveryId);
      const latitude = Number(raw?.latitude);
      const longitude = Number(raw?.longitude);
      if (
        !Number.isInteger(orderId) ||
        !Number.isInteger(deliveryId) ||
        !Number.isFinite(latitude) ||
        !Number.isFinite(longitude)
      ) {
        return;
      }

      // Es un evento efímero para la pantalla de seguimiento; no crea toast
      // ni historial de notificación.
      emit({
        id: 0,
        title: "",
        message: "",
        type: "DeliveryLocationUpdated",
        relatedEntityType: "Order",
        relatedEntityId: orderId,
        deliveryId,
        latitude,
        longitude,
        updatedAt: String(raw?.updatedAt ?? new Date().toISOString()),
      });
      return;
    }

    if (eventName === "RealtimeConnected") {
      void loadHistory();
      emit({ id: 0, title: "", message: "", type: "Resync" });
      return;
    }

    if (eventName === "NotificationsChanged") void loadHistory();
  }, [emit, loadHistory]);

  useRealtimeEvents(
    ["ReceiveNotification", "NotificationsChanged", "DeliveryLocationUpdated", "RealtimeConnected"],
    handleRealtimeEvent,
  );

  const subscribe = useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

  const reportDeliveryLocation = useCallback(
    (latitude: number, longitude: number) =>
      invokeRealtimeMethod("UpdateDeliveryLocation", latitude, longitude),
    [],
  );

  const markAllRead = useCallback(() => {
    setUnreadCount(0);
    if (userId) notificationService.markAllAsRead(userId).catch(() => {});
  }, [userId]);

  const clear = useCallback(() => {
    const ids = historyRef.current.map((n) => n.id).filter((id) => id > 0);
    setHistory([]);
    setUnreadCount(0);
    ids.forEach((id) => notificationService.delete(id).catch(() => {}));
  }, []);

  const openRelatedOrder = useCallback((notification: ToastNotification) => {
    // Empleados nunca acceden a las rutas del Cliente por tocar este aviso.
    if (!clientPreferences || !user?.token) return;
    if (notification.relatedEntityType?.toLowerCase() !== "order") return;
    const orderId = Number(notification.relatedEntityId);
    if (!Number.isSafeInteger(orderId) || orderId <= 0) return;
    router.push({ pathname: "/client/profile", params: { orderId: String(orderId) } });
  }, [router, clientPreferences, user?.token]);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ history, unreadCount, markAllRead, clear, subscribe, openRelatedOrder, reportDeliveryLocation }),
    [history, unreadCount, markAllRead, clear, subscribe, openRelatedOrder, reportDeliveryLocation],
  );

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <View
          pointerEvents="box-none"
          style={StyleSheet.absoluteFill}
        >
          <NotificationToastContainer
            notifications={toasts}
            onDismiss={dismissToast}
            onSelect={clientPreferences ? openRelatedOrder : undefined}
            t={deliveryPreferences?.translate}
            colors={
              deliveryTheme
                ? {
                    surface: deliveryTheme.surface,
                    text: deliveryTheme.text,
                    mutedText: deliveryTheme.mutedText,
                    border: deliveryTheme.border,
                  }
                : undefined
            }
          />
        </View>
        {/* Necesario para el botón "Limpiar" de la campana (showAppAlert) */}
        <AppAlertModal
          colors={
            deliveryTheme
              ? {
                  surface: deliveryTheme.surface,
                  text: deliveryTheme.text,
                  mutedText: deliveryTheme.mutedText,
                  accent: deliveryTheme.accent,
                  accentSoft: deliveryTheme.dangerBg,
                  danger: deliveryTheme.dangerText,
                  border: deliveryTheme.border,
                  elevatedSurface: deliveryTheme.elevated,
                }
              : undefined
          }
        />
      </View>
    </Ctx.Provider>
  );
}

export function useUserNotifications() {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error(
      "useUserNotifications debe usarse dentro de UserNotificationsProvider",
    );
  return ctx;
}

// Ejecuta `cb` cada vez que llega una notificación (o "Resync" tras reconectar).
export function useNotificationListener(cb: Listener) {
  const { subscribe } = useUserNotifications();
  const ref = useRef(cb);
  useEffect(() => {
    ref.current = cb;
  }, [cb]);
  useEffect(() => subscribe((n) => ref.current(n)), [subscribe]);
}

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AppState, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as signalR from "@microsoft/signalr";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getToken } from "@/features/auth/services/tokenStorage";
import { refreshAccessToken } from "@/features/auth/services/apiClient";
import {
  decodeToken,
  getUserIdFromToken,
} from "@/features/auth/services/decodeToken";
import { normalizeNotificationType } from "../utils/notificationType";
import { notificationService } from "../services/notificationService";
import {
  NotificationToastContainer,
  type ToastNotification,
} from "@/features/shared/components/NotificationToast";
import { AppAlertModal } from "@/features/shared/components/AppAlertModal";

const notifySound = require("../../../assets/sounds/notify.wav");

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

// Tipos que hacen sonar el celular del cliente / repartidor.
const SOUND_TYPES = new Set([
  "PaymentConfirmed",
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
}

const Ctx = createContext<UserNotificationsValue | undefined>(undefined);

export function UserNotificationsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const player = useAudioPlayer(notifySound);
  const playerRef = useRef(player);
  playerRef.current = player;

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

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  useEffect(() => {
    if (!user?.token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: async () => {
          const token = await getToken();
          if (!token) return "";
          const decoded = decodeToken(token);
          const expiring = !decoded || decoded.exp * 1000 < Date.now() + 10000;
          if (expiring) {
            const refreshed = await refreshAccessToken();
            return refreshed ?? "";
          }
          return token;
        },
        withCredentials: false,
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: ({ previousRetryCount }) => {
          if (previousRetryCount === 0) return 0;
          if (previousRetryCount === 1) return 2000;
          if (previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .build();

    connection.on("ReceiveNotification", (raw: any) => {
      const n: ToastNotification = {
        ...raw,
        type: normalizeNotificationType(raw.type),
      };

      const alreadyKnown = historyRef.current.some((p) => p.id === n.id);
      if (!alreadyKnown) {
        setHistory((prev) => [n, ...prev].slice(0, 50));
        setUnreadCount((c) => c + 1);
      }
      setToasts((prev) => [...prev, n]);

      if (SOUND_TYPES.has(n.type)) {
        try {
          playerRef.current.seekTo(0);
          playerRef.current.play();
        } catch {
          // un fallo de audio no debe romper la notificación
        }
      }
      emit(n);
    });

    // Al reconectar, se recupera lo que pudo perderse y se avisa a las
    // pantallas para que refresquen sus datos ("Resync").
    const resync = () => {
      loadHistory();
      emit({ id: 0, title: "", message: "", type: "Resync" });
    };
    connection.onreconnected(resync);

    let disposed = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;

    const startIfDown = () => {
      if (disposed) return;
      if (connection.state !== signalR.HubConnectionState.Disconnected) return;
      connection
        .start()
        .then(resync)
        .catch(() => {
          // Falló el arranque (401, túnel caído...): reintenta en 5 s
          if (!disposed) retryTimer = setTimeout(startIfDown, 5000);
        });
    };
    startIfDown();

    // Al volver a primer plano: reconecta si el SO mató el socket y refresca.
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        if (connection.state === signalR.HubConnectionState.Disconnected) {
          startIfDown();
        } else {
          resync();
        }
      }
    });

    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      appStateSub.remove();
      connection.stop();
    };
  }, [user?.token, loadHistory, emit]);

  const subscribe = useCallback((fn: Listener) => {
    listenersRef.current.add(fn);
    return () => {
      listenersRef.current.delete(fn);
    };
  }, []);

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

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const value = useMemo(
    () => ({ history, unreadCount, markAllRead, clear, subscribe }),
    [history, unreadCount, markAllRead, clear, subscribe],
  );

  return (
    <Ctx.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        <View
          pointerEvents="box-none"
          style={[StyleSheet.absoluteFill, { paddingTop: insets.top }]}
        >
          <NotificationToastContainer
            notifications={toasts}
            onDismiss={dismissToast}
          />
        </View>
        {/* Necesario para el botón "Limpiar" de la campana (showAppAlert) */}
        <AppAlertModal />
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
  ref.current = cb;
  useEffect(() => subscribe((n) => ref.current(n)), [subscribe]);
}

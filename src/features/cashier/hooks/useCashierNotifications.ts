import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import * as signalR from "@microsoft/signalr";
import { useAudioPlayer, setAudioModeAsync } from "expo-audio";
import { API_BASE_URL } from "@/config/api";
import { useAuth } from "@/features/auth/context/AuthContext";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
import { getToken } from "@/features/auth/services/tokenStorage";
import { refreshAccessToken } from "@/features/auth/services/apiClient";
import { decodeToken } from "@/features/auth/services/decodeToken";

// Para un sonido propio del cajero: pon cashier-notify.wav en assets/sounds
// y cambia el nombre aquí.
const cashierSound = require("../../../assets/sounds/notify.wav");

setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});

export interface CashierNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

// Solo estos tipos hacen sonar al cajero.
// OrderReady = pedido listo para cobrar. OrderCreated = domicilio nuevo por confirmar.
const SOUND_TYPES = ["OrderReady", "OrderCreated"];

export function useCashierNotifications(
  onNotification?: (n: CashierNotification) => void,
  soundPreference: boolean = true,
) {
  const { user } = useAuth();
  const player = useAudioPlayer(cashierSound);

  // En web el navegador bloquea audio hasta que el usuario toque algo.
  const [soundEnabled, setSoundEnabled] = useState(Platform.OS !== "web");

  // Refs para que el listener (registrado una sola vez) lea siempre lo más reciente.
  const soundEnabledRef = useRef(soundEnabled);
  const preferenceRef = useRef(soundPreference);
  const callbackRef = useRef(onNotification);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);
  useEffect(() => {
    preferenceRef.current = soundPreference;
  }, [soundPreference]);
  callbackRef.current = onNotification;

  const enableSound = () => {
    try {
      player.seekTo(0);
      player.play();
      setSoundEnabled(true);
    } catch (e) {
      console.log("[Cajero] No se pudo desbloquear el sonido:", e);
    }
  };

  useEffect(() => {
    if (!user?.token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: async () => {
          const token = await getToken();
          if (!token) return "";

          const decoded = decodeToken(token);
          const isExpiredOrExpiring =
            !decoded || decoded.exp * 1000 < Date.now() + 10000;

          if (isExpiredOrExpiring) {
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

    connection.on("ReceiveNotification", (notification: any) => {
      const type = normalizeNotificationType(notification.type);

      if (
        SOUND_TYPES.includes(type) &&
        soundEnabledRef.current &&
        preferenceRef.current
      ) {
        try {
          player.seekTo(0);
          player.play();
        } catch {
          // Un fallo de audio no debe romper la notificación.
        }
      }

      callbackRef.current?.({ ...notification, type });
    });
      connection.start().catch(async (err) => {
        const tokenDebug = await getToken();
        console.log("Error conectando al Hub de notificaciones:", err);
        console.log(
          "[DEBUG] Token usado:",
          tokenDebug ? tokenDebug.slice(0, 20) + "..." : "NULO/VACÍO",
        );
        console.log("[DEBUG] URL del hub:", `${API_BASE_URL}/hubs/notifications`);
      });

    return () => {
      connection.stop();
    };
  }, [user?.token]);

  return { soundEnabled, enableSound };
}

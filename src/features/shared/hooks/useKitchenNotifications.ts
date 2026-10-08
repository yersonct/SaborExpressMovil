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

const notifySound = require("../../../assets/sounds/notify.wav");
const kitchenNotifySound = require("../../../assets/sounds/kitchen-notify.wav");

// Por defecto, iOS silencia cualquier audio de la app si el switch lateral
// del celular está en modo silencioso. Esto lo desactiva para que el sonido
// de "pedido nuevo/listo" siempre suene, sin importar esa posición del switch.
// En Android no hace falta, pero no afecta si se llama igual.
setAudioModeAsync({
  playsInSilentMode: true,
}).catch(() => {
  // Si falla (por ejemplo en web, donde no aplica), no debe romper nada.
});

interface KitchenNotification {
  id: number;
  title: string;
  message: string;
  type: string | number;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

// Conecta al Hub de notificaciones en tiempo real y reproduce un sonido
// cada vez que llega una notificación mientras la app está en primer plano.
export function useKitchenNotifications(
  onNotification?: (n: KitchenNotification) => void,
) {
  const { user } = useAuth();
  const connectionRef = useRef<signalR.HubConnection | null>(null);
  // Dos sonidos distintos para que mesero y cocinero no los confundan:
  // OrderReady (mesero) usa notify.wav, OrderCreated (cocinero) usa el otro.
  const waiterPlayer = useAudioPlayer(notifySound);
  const kitchenPlayer = useAudioPlayer(kitchenNotifySound);

  // En web, los navegadores bloquean cualquier audio que no haya sido
  // disparado directamente por un gesto del usuario (click/tap). Por eso
  // arrancamos "bloqueados" en web hasta que el usuario toque el aviso, y
  // ese primer toque reproduce el sonido una vez para "desbloquearlo" — de
  // ahí en adelante ya puede sonar solo el resto de la sesión. En apps
  // nativas (Android/iOS) esta restricción no existe, así que ahí arrancamos
  // ya habilitados.
  const [soundEnabled, setSoundEnabled] = useState(Platform.OS !== "web");

  // El listener de SignalR se registra UNA sola vez (el useEffect de abajo
  // solo depende de user?.token) y queda con el valor de soundEnabled
  // "congelado" del momento en que se registró. Usamos un ref para que el
  // listener siempre lea el valor MÁS RECIENTE, no el de cuando se conectó.
  const soundEnabledRef = useRef(soundEnabled);
  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  const enableSound = () => {
    try {
      // Desbloqueamos ambos players con este primer gesto del usuario,
      // así no importa cuál de los dos suene primero después.
      waiterPlayer.seekTo(0);
      waiterPlayer.play();
      kitchenPlayer.seekTo(0);
      kitchenPlayer.play();
      setSoundEnabled(true);
    } catch (e) {
      console.log("[DEBUG] No se pudo desbloquear el sonido:", e);
    }
  };

  useEffect(() => {
    if (!user?.token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, {
        // Lee el token MÁS RECIENTE en cada conexión/reconexión, en vez de
        // capturar user.token una sola vez al montar el efecto. Así, si el
        // token expiró (15 min) y ya fue refrescado en segundo plano por
        // apiClient.ts, SignalR usa el nuevo token al reconectar, en vez
        // de seguir mandando uno vencido y recibir 401 para siempre.
        accessTokenFactory: async () => {
          const token = await getToken();
          if (!token) return "";

          // Si el token ya expiró (o expira en menos de 10s), lo refrescamos
          // ANTES de que SignalR lo use, en vez de mandar uno vencido y
          // recibir 401 sin que nada dispare el refresh (SignalR no pasa
          // por fetchAuthed, así que este chequeo es necesario aquí también).
          const decoded = decodeToken(token);
          const isExpiredOrExpiring =
            !decoded || decoded.exp * 1000 < Date.now() + 10000;

          if (isExpiredOrExpiring) {
            const refreshed = await refreshAccessToken();
            return refreshed ?? "";
          }

          return token;
        },
        withCredentials: false, // usamos Bearer token, no cookies del navegador
        // Evita la página de advertencia de Dev Tunnels tanto en el
        // negotiate (fetch) como en el WebSocket/long-polling posterior.
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
      })
      // Por defecto, withAutomaticReconnect() solo reintenta 4 veces
      // (0s, 2s, 10s, 30s) y luego se rinde para siempre — el usuario tendría
      // que recargar la página manualmente para volver a conectar. Con esta
      // política personalizada, reintenta INDEFINIDAMENTE: espera creciente
      // hasta un tope de 30s entre intentos, así que si el túnel de Dev
      // Tunnels vuelve después de estar caído 5 minutos, la app se reconecta
      // sola sin que nadie tenga que hacer nada.
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: ({ previousRetryCount }) => {
          if (previousRetryCount === 0) return 0;
          if (previousRetryCount === 1) return 2000;
          if (previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.None)
    .build();

    connection.on(
      "ReceiveNotification",
      (notification: KitchenNotification) => {
        const normalizedType = normalizeNotificationType(notification.type);

        // Suena cuando el pedido está LISTO (le llega a Mesero/Cajero) o
        // cuando llega un pedido NUEVO (le llega a Cocinero). El backend ya
        // filtra por rol al elegir a quién mandar cada tipo de notificación,
        // así que aquí no hace falta distinguir por rol: si a este usuario
        // le llegó, es porque le corresponde sonar.
        if (soundEnabledRef.current) {
          const playerToUse =
            normalizedType === "OrderReady"
              ? waiterPlayer
              : normalizedType === "OrderCreated"
                ? kitchenPlayer
                : null;

          if (playerToUse) {
            try {
              playerToUse.seekTo(0);
              playerToUse.play();
            } catch {
              // Si el sonido falla (por ejemplo, silencio del dispositivo),
              // no debe romper la recepción de la notificación.
            }
          }
        }
        // Mandamos el type ya normalizado para que toasts / historial /
        // íconos también funcionen sin importar cómo serializó el backend.
        onNotification?.({ ...notification, type: normalizedType });
      },
    );

  connection.start().catch(async (err) => {
    const tokenDebug = await getToken();
    console.log("Error conectando al Hub de notificaciones:", err);
    console.log(
      "[DEBUG] Token usado:",
      tokenDebug ? tokenDebug.slice(0, 20) + "..." : "NULO/VACÍO",
    );
    console.log("[DEBUG] URL del hub:", `${API_BASE_URL}/hubs/notifications`);
  });
    connectionRef.current = connection;

    return () => {
      connection.stop().catch(() => {});
      connectionRef.current = null;
    };
  }, [user?.token]);

  return { soundEnabled, enableSound };
}

import { useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  registerWaiterPushDevice,
  type WaiterPushDeviceSettings,
} from "@/features/notifications/services/pushDeviceService";
import { useWaiterNotificationPreferences } from "@/features/waiter/context/WaiterNotificationPreferencesContext";

type NotificationsModule = typeof import("expo-notifications");

let notificationHandlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule> {
  // Expo Go SDK 53+ throws while evaluating expo-notifications on Android.
  // This function is only called after the Expo Go guard below.
  const notifications = await import("expo-notifications");

  if (!notificationHandlerConfigured) {
    notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: false,
        shouldShowList: false,
        shouldPlaySound: false,
        shouldSetBadge: false,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return notifications;
}

// Android persists channel settings; v3 gives the corrected default-sound setup fresh channels.
const channelId = (soundEnabled: boolean, vibrationEnabled: boolean) =>
  `waiter-orders-v3-${soundEnabled ? "sound" : "silent"}-${vibrationEnabled ? "vibrate" : "quiet"}`;
// Expo Go es el único entorno "storeClient"; un development build no lo es.
const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

async function configureAndroidChannels(notifications: NotificationsModule) {
  if (Platform.OS !== "android") return;

  for (const soundEnabled of [false, true]) {
    for (const vibrationEnabled of [false, true]) {
      const channel = await notifications.setNotificationChannelAsync(
        channelId(soundEnabled, vibrationEnabled),
        {
          name: `Pedidos listos${soundEnabled ? " con sonido" : " sin sonido"}${vibrationEnabled ? " y vibración" : ""}`,
          importance: notifications.AndroidImportance.HIGH,
          // Si no se especifica el campo, Android usa su sonido predeterminado.
          // "default" aquí se interpreta como nombre de sonido personalizado.
          ...(!soundEnabled ? { sound: null } : {}),
          enableVibrate: vibrationEnabled,
          vibrationPattern: vibrationEnabled ? [0, 300, 150, 300] : [],
          showBadge: true,
        },
      );

      if (__DEV__ && vibrationEnabled && channel && !channel.enableVibrate) {
        console.warn(
          `Android tiene desactivada la vibración del canal ${channel.id}; actívala en los ajustes de notificaciones de SaborExpress.`,
        );
      }
    }
  }
}

export function WaiterPushNotificationRegistration() {
  const { user } = useAuth();
  const preferences = useWaiterNotificationPreferences();
  const expoPushTokenRef = useRef<string | null>(null);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    preferencesRef.current = preferences;
  }, [preferences]);

  async function syncPreferences(expoPushToken: string) {
    const current = preferencesRef.current;
    const settings: WaiterPushDeviceSettings = {
      expoPushToken,
      platform: Platform.OS,
      soundEnabled: current.soundNotifications,
      vibrationEnabled: current.vibrationNotifications,
    };
    try {
      await registerWaiterPushDevice(settings);
    } catch (error) {
      if (__DEV__) console.warn("No se pudieron guardar las preferencias push:", error);
    }
  }

  useEffect(() => {
    if (!user?.token || !preferences.hydrated) return;
    if (isExpoGo) {
      if (__DEV__) {
        console.info(
          "Push remoto desactivado en Expo Go; usa un development build para recibir pedidos con la app cerrada.",
        );
      }
      return;
    }

    let active = true;
    let registering = false;

    const register = async () => {
      if (registering || Platform.OS === "web" || !Device.isDevice) return;
      registering = true;

      try {
        const Notifications = await loadNotifications();
        await configureAndroidChannels(Notifications);
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted && permission.canAskAgain) {
          permission = await Notifications.requestPermissionsAsync();
        }
        if (!permission.granted) return;

        const projectId =
          Constants.expoConfig?.extra?.eas?.projectId ??
          Constants.easConfig?.projectId;
        const pushToken = await Notifications.getExpoPushTokenAsync(
          projectId ? { projectId } : undefined,
        );
        if (!active) return;

        expoPushTokenRef.current = pushToken.data;
        await syncPreferences(pushToken.data);
      } catch (error) {
        if (__DEV__) console.warn("No se pudo registrar el push del mesero:", error);
      } finally {
        registering = false;
      }
    };

    void register();
    const appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      if (expoPushTokenRef.current) {
        void syncPreferences(expoPushTokenRef.current);
      } else {
        void register();
      }
    });

    return () => {
      active = false;
      appStateSubscription.remove();
      expoPushTokenRef.current = null;
    };
  }, [user?.token, preferences.hydrated]);

  useEffect(() => {
    const token = expoPushTokenRef.current;
    if (!token || !preferences.hydrated) return;
    void syncPreferences(token);
  }, [preferences.hydrated, preferences.soundNotifications, preferences.vibrationNotifications]);

  return null;
}

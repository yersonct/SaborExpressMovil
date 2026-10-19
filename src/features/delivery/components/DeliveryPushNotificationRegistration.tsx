import { useCallback, useEffect, useRef } from "react";
import { AppState, Platform } from "react-native";
import Constants, { ExecutionEnvironment } from "expo-constants";
import * as Device from "expo-device";
import { useAuth } from "@/features/auth/context/AuthContext";
import {
  registerDeliveryPushDevice,
  unregisterPushDevice,
  type PushDeviceSettings,
} from "@/features/notifications/services/pushDeviceService";
import { useDeliveryContext } from "./context/DeliveryContext";
import type { LanguageCode } from "@/locales/DeliveryTranslations";
import { subscribeToNetworkRecovery } from "@/features/shared/services/networkStatus";

type NotificationsModule = typeof import("expo-notifications");

let notificationHandlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule> {
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

const isExpoGo =
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const channelId = (soundEnabled: boolean, vibrationEnabled: boolean) =>
  `delivery-orders-v2-${soundEnabled ? "sound" : "silent"}-${vibrationEnabled ? "vibrate" : "quiet"}`;

const CHANNEL_COPY: Record<LanguageCode, {
  title: string;
  withSound: string;
  withoutSound: string;
  vibration: string;
}> = {
  es: { title: "Alertas de entrega", withSound: " con sonido", withoutSound: " sin sonido", vibration: " y vibración" },
  en: { title: "Delivery alerts", withSound: " with sound", withoutSound: " without sound", vibration: " and vibration" },
  pt: { title: "Alertas de entrega", withSound: " com som", withoutSound: " sem som", vibration: " e vibração" },
  fr: { title: "Alertes de livraison", withSound: " avec son", withoutSound: " sans son", vibration: " et vibration" },
};

async function configureAndroidChannels(
  notifications: NotificationsModule,
  language: LanguageCode,
) {
  if (Platform.OS !== "android") return;
  const copy = CHANNEL_COPY[language] ?? CHANNEL_COPY.es;

  for (const soundEnabled of [false, true]) {
    for (const vibrationEnabled of [false, true]) {
      const channel = await notifications.setNotificationChannelAsync(
        channelId(soundEnabled, vibrationEnabled),
        {
          name: `${copy.title}${soundEnabled ? copy.withSound : copy.withoutSound}${vibrationEnabled ? copy.vibration : ""}`,
          importance: notifications.AndroidImportance.HIGH,
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

export function DeliveryPushNotificationRegistration() {
  const { user } = useAuth();
  const preferences = useDeliveryContext();
  const { setPushStatus } = preferences;
  const expoPushTokenRef = useRef<string | null>(null);
  const preferencesRef = useRef(preferences);
  preferencesRef.current = preferences;

  const syncPreferences = useCallback(async (expoPushToken: string) => {
    const current = preferencesRef.current;
    if (!current.preferencesHydrated || !current.pushNotifications) return;
    const settings: PushDeviceSettings = {
      expoPushToken,
      platform: Platform.OS,
      soundEnabled: current.soundNotifications,
      vibrationEnabled: current.vibrationNotifications,
    };
    try {
      const Notifications = await loadNotifications();
      await configureAndroidChannels(Notifications, current.language);
      await registerDeliveryPushDevice(settings);
      if (!preferencesRef.current.pushNotifications) {
        await unregisterPushDevice(5000);
        setPushStatus("disabled");
      } else {
        setPushStatus("enabled");
      }
    } catch (error) {
      setPushStatus("error");
      if (__DEV__) console.warn("No se pudieron guardar las preferencias push del repartidor:", error);
    }
  }, []);

  useEffect(() => {
    if (!user?.token || !preferences.preferencesHydrated) return;
    if (!preferences.pushNotifications) {
      setPushStatus("disabled");
      expoPushTokenRef.current = null;
      void unregisterPushDevice(5000).catch(() => undefined);
      return;
    }
    if (isExpoGo || Platform.OS === "web" || !Device.isDevice) {
      setPushStatus("unavailable");
      if (__DEV__) {
        console.info(
          "Las notificaciones remotas del repartidor requieren instalar un development build; Expo Go no las recibe en Android.",
        );
      }
      return;
    }

    let active = true;
    let registering = false;
    setPushStatus("checking");

    const register = async () => {
      if (registering || Platform.OS === "web" || !Device.isDevice) return;
      registering = true;
      try {
        const Notifications = await loadNotifications();
        await configureAndroidChannels(Notifications, preferencesRef.current.language);
        let permission = await Notifications.getPermissionsAsync();
        if (!permission.granted && permission.canAskAgain) {
          permission = await Notifications.requestPermissionsAsync();
        }
        if (!permission.granted) {
          if (active) setPushStatus("permission-denied");
          if (__DEV__) {
            console.warn(
              "No se registró el push del repartidor porque Android no concedió permiso para mostrar notificaciones.",
            );
          }
          return;
        }

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
        if (active) setPushStatus("error");
        if (__DEV__) console.warn("No se pudo registrar el push del repartidor:", error);
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
  }, [
    user?.token,
    preferences.preferencesHydrated,
    preferences.pushNotifications,
    syncPreferences,
  ]);

  useEffect(() => {
    const token = expoPushTokenRef.current;
    if (
      !token ||
      !preferences.preferencesHydrated ||
      !preferences.pushNotifications
    ) return;
    void syncPreferences(token);
  }, [
    preferences.preferencesHydrated,
    preferences.pushNotifications,
    preferences.language,
    preferences.soundNotifications,
    preferences.vibrationNotifications,
    syncPreferences,
  ]);

  useEffect(
    () => subscribeToNetworkRecovery(() => {
      const token = expoPushTokenRef.current;
      if (token) void syncPreferences(token);
      else if (
        preferencesRef.current.preferencesHydrated &&
        !preferencesRef.current.pushNotifications
      ) void unregisterPushDevice(5000).catch(() => undefined);
    }),
    [syncPreferences],
  );

  return null;
}

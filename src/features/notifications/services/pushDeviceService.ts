import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import { getApiLanguage } from "@/features/auth/services/apiLanguage";
import { getToken } from "@/features/auth/services/tokenStorage";

const PUSH_DEVICE_TOKEN_KEY = "saborexpress_waiter_expo_push_token";

export interface PushDeviceSettings {
  expoPushToken: string;
  platform: string;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export type WaiterPushDeviceSettings = PushDeviceSettings;
export type CashierPushDeviceSettings = PushDeviceSettings;

export async function registerWaiterPushDevice(
  settings: WaiterPushDeviceSettings,
): Promise<void> {
  await registerPushDevice(settings, "waiter");
}

export async function registerCashierPushDevice(
  settings: CashierPushDeviceSettings,
): Promise<void> {
  await registerPushDevice(settings, "cashier");
}

export async function registerDeliveryPushDevice(
  settings: PushDeviceSettings,
): Promise<void> {
  await registerPushDevice(settings, "delivery");
}

async function registerPushDevice(
  settings: PushDeviceSettings,
  notificationProfile: "waiter" | "cashier" | "delivery",
): Promise<void> {
  const response = await fetchAuthed(
    `${API_BASE_URL}/api/notifications/push-device`,
    {
      method: "PUT",
      body: JSON.stringify({ ...settings, notificationProfile }),
    },
  );
  if (!response.ok) {
    throw new Error(`No se pudo registrar el dispositivo (${response.status}).`);
  }
  await AsyncStorage.setItem(PUSH_DEVICE_TOKEN_KEY, settings.expoPushToken);
}

// Se ejecuta antes de borrar la sesión para que el dispositivo deje de recibir
// pedidos del usuario que acaba de cerrar sesión.
export async function unregisterPushDevice(timeoutMs = 700): Promise<void> {
  const expoPushToken = await AsyncStorage.getItem(PUSH_DEVICE_TOKEN_KEY);
  const accessToken = await getToken();
  if (!expoPushToken || !accessToken) return;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(
      `${API_BASE_URL}/api/notifications/push-device/unregister`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": getApiLanguage(),
          Authorization: `Bearer ${accessToken}`,
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
        },
        body: JSON.stringify({ expoPushToken }),
        signal: controller.signal,
      },
    );
    if (response.ok) await AsyncStorage.removeItem(PUSH_DEVICE_TOKEN_KEY);
  } catch {
    // El cierre de sesión local no depende de la red. El siguiente registro
    // reasocia el mismo token con la cuenta que vuelva a iniciar sesión.
  } finally {
    clearTimeout(timeout);
  }
}

// Compatibilidad con el nombre que ya usa el cierre de sesi\u00f3n del mesero.
export const unregisterWaiterPushDevice = unregisterPushDevice;

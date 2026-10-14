import AsyncStorage from "@react-native-async-storage/async-storage";
import type { LanguageCode } from "../../../locales/CashierTranslations";

export type CashierPreferences = {
  language: LanguageCode;
  isDark: boolean;
  notificationSound: boolean;
  vibrationNotifications: boolean;
  autoPrint: boolean;
};

export const DEFAULT_CASHIER_PREFERENCES: CashierPreferences = {
  language: "es",
  isDark: false,
  notificationSound: true,
  vibrationNotifications: true,
  autoPrint: true,
};

export const CASHIER_LANGUAGE_OPTIONS: LanguageCode[] = [
  "es",
  "en",
  "pt",
  "fr",
];

export function getCashierStorageKey(userScope: string): string {
  return `saborexpress-cashier-preferences:${encodeURIComponent(userScope)}`;
}

export async function loadCashierPreferences(
  storageKey: string,
): Promise<Partial<CashierPreferences>> {
  try {
    const savedValue = await AsyncStorage.getItem(storageKey);
    if (!savedValue) return {};
    return JSON.parse(savedValue) as Partial<CashierPreferences>;
  } catch {
    return {};
  }
}

export async function persistCashierPreferences(
  storageKey: string,
  preferences: CashierPreferences,
): Promise<void> {
  await AsyncStorage.setItem(storageKey, JSON.stringify(preferences));
}

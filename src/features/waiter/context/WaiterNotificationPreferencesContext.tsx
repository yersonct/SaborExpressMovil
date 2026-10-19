import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { waiterPreferenceStorageKey } from "./waiterPreferenceStorage";

type WaiterNotificationPreferences = {
  soundNotifications: boolean;
  vibrationNotifications: boolean;
};

type WaiterNotificationPreferencesContextValue = WaiterNotificationPreferences & {
  isWaiterPanel: boolean;
  hydrated: boolean;
  preferencesError: string | null;
  setSoundNotifications: (enabled: boolean) => void;
  setVibrationNotifications: (enabled: boolean) => void;
};

const DEFAULT_PREFERENCES: WaiterNotificationPreferences = {
  soundNotifications: true,
  vibrationNotifications: true,
};

const WaiterNotificationPreferencesContext =
  createContext<WaiterNotificationPreferencesContextValue | null>(null);

export function WaiterNotificationPreferencesProvider({
  children,
  storageScope,
}: {
  children: React.ReactNode;
  storageScope: string;
}) {
  const [preferences, setPreferences] =
    useState<WaiterNotificationPreferences>(DEFAULT_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const storageKey = waiterPreferenceStorageKey("notifications", storageScope);

  useEffect(() => {
    let active = true;

    AsyncStorage.getItem(storageKey)
      .then((storedValue) => {
        const value = storedValue ?? globalThis.localStorage?.getItem(storageKey);
        if (!value || !active) return;
        const parsed: unknown = JSON.parse(value);
        if (!parsed || typeof parsed !== "object") return;

        const saved = parsed as Partial<WaiterNotificationPreferences>;
        setPreferences({
          soundNotifications:
            typeof saved.soundNotifications === "boolean"
              ? saved.soundNotifications
              : DEFAULT_PREFERENCES.soundNotifications,
          vibrationNotifications:
            typeof saved.vibrationNotifications === "boolean"
              ? saved.vibrationNotifications
              : DEFAULT_PREFERENCES.vibrationNotifications,
        });
      })
      .catch(() => undefined)
      .finally(() => {
        if (active) setHydrated(true);
      });

    return () => {
      active = false;
    };
  }, [storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    void AsyncStorage.setItem(storageKey, JSON.stringify(preferences))
      .then(() => setPreferencesError(null))
      .catch(() => setPreferencesError("No se pudieron guardar los ajustes de notificaciones del mesero."));
    try {
      globalThis.localStorage?.setItem(storageKey, JSON.stringify(preferences));
    } catch {
      // Browser storage may be unavailable; AsyncStorage remains the primary store.
    }
  }, [hydrated, preferences, storageKey]);

  const value = useMemo<WaiterNotificationPreferencesContextValue>(
    () => ({
      ...preferences,
      isWaiterPanel: true,
      hydrated,
      preferencesError,
      setSoundNotifications: (soundNotifications) =>
        setPreferences((current) => ({ ...current, soundNotifications })),
      setVibrationNotifications: (vibrationNotifications) =>
        setPreferences((current) => ({ ...current, vibrationNotifications })),
    }),
    [hydrated, preferences, preferencesError],
  );

  return (
    <WaiterNotificationPreferencesContext.Provider value={value}>
      {children}
    </WaiterNotificationPreferencesContext.Provider>
  );
}

export function useWaiterNotificationPreferences() {
  const context = useContext(WaiterNotificationPreferencesContext);
  return (
    context ?? {
      ...DEFAULT_PREFERENCES,
      isWaiterPanel: false,
      hydrated: true,
      preferencesError: null,
      setSoundNotifications: () => undefined,
      setVibrationNotifications: () => undefined,
    }
  );
}

// src/features/delivery/context/DeliveryContext.tsx
import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageCode, TRANSLATIONS } from '../../../../locales/DeliveryTranslations';
import { setNetworkErrorLanguage } from '@/features/shared/services/networkStatus';
import { getApiLanguage, setApiLanguage } from '@/features/auth/services/apiLanguage';
import {
  getUserLanguagePreference,
  saveUserLanguagePreference,
} from '@/features/userPreferences/services/userLanguageService';

type DeliveryContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  soundNotifications: boolean;
  setSoundNotifications: (enabled: boolean) => void;
  pushNotifications: boolean;
  setPushNotifications: (enabled: boolean) => void;
  vibrationNotifications: boolean;
  setVibrationNotifications: (enabled: boolean) => void;
  preferencesHydrated: boolean;
  preferencesError: string | null;
  pushStatus: "checking" | "enabled" | "unavailable" | "permission-denied" | "error" | "disabled";
  setPushStatus: (status: DeliveryContextType["pushStatus"]) => void;
};

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

type DeliveryPreferences = {
  language: LanguageCode;
  isDark: boolean;
  soundNotifications: boolean;
  pushNotifications: boolean;
  vibrationNotifications: boolean;
};

const DEFAULT_PREFERENCES: DeliveryPreferences = {
  language: 'es',
  isDark: false,
  soundNotifications: true,
  pushNotifications: true,
  vibrationNotifications: true,
};

const DELIVERY_LANGUAGES: LanguageCode[] = ['es', 'en', 'pt', 'fr'];

export const DeliveryProvider: React.FC<{
  children: ReactNode;
  storageScope?: string;
}> = ({ children, storageScope = 'anonymous' }) => {
  const [preferences, setPreferences] = useState<DeliveryPreferences>(DEFAULT_PREFERENCES);
  const [preferencesHydrated, setPreferencesHydrated] = useState(false);
  const [preferencesError, setPreferencesError] = useState<string | null>(null);
  const [pushStatus, setPushStatus] = useState<DeliveryContextType["pushStatus"]>("checking");
  const storageKey = `saborexpress-delivery:${encodeURIComponent(storageScope)}:preferences`;

  useEffect(() => {
    let active = true;
    const languageSelectedBeforeLogin = getApiLanguage();
    setPreferencesHydrated(false);
    setPreferencesError(null);
    setPushStatus("checking");
    const loadPreferences = async () => {
      let cached: Partial<DeliveryPreferences> = {};
      try {
        const stored = await AsyncStorage.getItem(storageKey);
        const raw = stored ?? globalThis.localStorage?.getItem(storageKey);
        if (raw) cached = JSON.parse(raw) as Partial<DeliveryPreferences>;
      } catch {
        // Use the server preference when the cache is unavailable.
      }
      if (!active) return;

      const cachedLanguage = DELIVERY_LANGUAGES.includes(cached.language as LanguageCode)
        ? cached.language as LanguageCode
        : null;
      setPreferences({
        language: cachedLanguage ?? DEFAULT_PREFERENCES.language,
        isDark: typeof cached.isDark === 'boolean' ? cached.isDark : DEFAULT_PREFERENCES.isDark,
        soundNotifications: typeof cached.soundNotifications === 'boolean'
          ? cached.soundNotifications : DEFAULT_PREFERENCES.soundNotifications,
        pushNotifications: typeof cached.pushNotifications === 'boolean'
          ? cached.pushNotifications : DEFAULT_PREFERENCES.pushNotifications,
        vibrationNotifications: typeof cached.vibrationNotifications === 'boolean'
          ? cached.vibrationNotifications : DEFAULT_PREFERENCES.vibrationNotifications,
      });

      let resolvedLanguage = cachedLanguage ?? languageSelectedBeforeLogin;
      try {
        const saved = await getUserLanguagePreference();
        resolvedLanguage = saved.isConfigured
          ? saved.language
          : cachedLanguage ?? languageSelectedBeforeLogin;
        if (!saved.isConfigured) await saveUserLanguagePreference(resolvedLanguage);
      } catch {
        // Keep the account-scoped language cache if the server is unreachable.
      }

      if (active) {
        setApiLanguage(resolvedLanguage);
        setPreferences((current) => ({ ...current, language: resolvedLanguage }));
        setPreferencesHydrated(true);
      }
    };
    void loadPreferences();

    return () => { active = false; };
  }, [storageKey]);

  useEffect(() => {
    setNetworkErrorLanguage(preferences.language);
    setApiLanguage(preferences.language);
  }, [preferences.language]);

  useEffect(() => {
    if (!preferencesHydrated) return;
    const serialized = JSON.stringify(preferences);
    void AsyncStorage.setItem(storageKey, serialized)
      .then(() => setPreferencesError(null))
      .catch(() => setPreferencesError("No se pudieron guardar las preferencias de reparto en este dispositivo."));
    try {
      globalThis.localStorage?.setItem(storageKey, serialized);
    } catch {
      // AsyncStorage sigue siendo el almacenamiento principal en la app nativa.
    }
  }, [preferences, preferencesHydrated, storageKey]);

  const value: DeliveryContextType = {
    ...preferences,
    preferencesHydrated,
    preferencesError,
    pushStatus,
    setPushStatus,
    setLanguage: (language) => {
      setApiLanguage(language);
      void saveUserLanguagePreference(language).catch(() => undefined);
      setPreferences((current) => ({ ...current, language }));
    },
    setIsDark: (isDark) => setPreferences((current) => ({ ...current, isDark })),
    setSoundNotifications: (soundNotifications) =>
      setPreferences((current) => ({ ...current, soundNotifications })),
    setPushNotifications: (pushNotifications) =>
      setPreferences((current) => ({ ...current, pushNotifications })),
    setVibrationNotifications: (vibrationNotifications) =>
      setPreferences((current) => ({ ...current, vibrationNotifications })),
  };

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
};

export const useDeliveryContext = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDeliveryContext debe usarse dentro de un DeliveryProvider');
  }
  return context;
};

export function useOptionalDeliveryNotificationPreferences() {
  const context = useContext(DeliveryContext);
  if (!context) return null;
  return {
    pushNotifications: context.pushNotifications,
    soundNotifications: context.soundNotifications,
    vibrationNotifications: context.vibrationNotifications,
    hydrated: context.preferencesHydrated,
    isDark: context.isDark,
    language: context.language,
    translate: (key: string) =>
      TRANSLATIONS[context.language]?.[key] ?? key,
  };
}

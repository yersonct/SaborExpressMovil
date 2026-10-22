import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setNetworkErrorLanguage } from '@/features/shared/services/networkStatus';
import { getApiLanguage, setApiLanguage } from '@/features/auth/services/apiLanguage';
import {
  getUserLanguagePreference,
  saveUserLanguagePreference,
} from '@/features/userPreferences/services/userLanguageService';
import { waiterPreferenceStorageKey } from './waiterPreferenceStorage';

const translations = require('../../../locales/translations.json') as Record<string, any>;
export type WaiterLanguageCode = 'es' | 'en' | 'pt' | 'fr';

type WaiterLanguageContextValue = {
  language: WaiterLanguageCode;
  hydrated: boolean;
  setLanguage: (language: WaiterLanguageCode) => void;
  t: Record<string, string>;
  languageOptions: { label: string; value: WaiterLanguageCode }[];
};

const DEFAULT_LANGUAGE: WaiterLanguageCode = 'es';

const WaiterLanguageContext = createContext<WaiterLanguageContextValue | null>(null);

export const WaiterLanguageProvider = ({ children, storageScope }: { children: React.ReactNode; storageScope: string }) => {
  const [language, setLanguageState] = useState<WaiterLanguageCode>(DEFAULT_LANGUAGE);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = waiterPreferenceStorageKey('language', storageScope);

  useEffect(() => {
    let active = true;
    const languageSelectedBeforeLogin = getApiLanguage();
    const loadLanguage = async () => {
      let cachedLanguage: WaiterLanguageCode | null = null;
      try {
        const storedLanguage = await AsyncStorage.getItem(storageKey);
        const value = (storedLanguage ?? globalThis.localStorage?.getItem(storageKey)) as WaiterLanguageCode | null;
        if (value && translations[value]?.waiter) cachedLanguage = value;
      } catch {
        // Use the server preference when the local cache is unavailable.
      }

      let resolvedLanguage = cachedLanguage ?? languageSelectedBeforeLogin;
      try {
        const saved = await getUserLanguagePreference();
        resolvedLanguage = saved.isConfigured
          ? saved.language
          : cachedLanguage ?? languageSelectedBeforeLogin;
        if (!saved.isConfigured) {
          await saveUserLanguagePreference(resolvedLanguage);
        }
      } catch {
        // Keep the account-scoped cache or the language selected on the login screen.
      }

      if (active) {
        setApiLanguage(resolvedLanguage);
        setLanguageState(resolvedLanguage);
        await AsyncStorage.setItem(storageKey, resolvedLanguage).catch(() => undefined);
        setHydrated(true);
      }
    };
    void loadLanguage();
    return () => { active = false; };
  }, [storageKey]);

  useEffect(() => {
    setNetworkErrorLanguage(language);
    setApiLanguage(language);
    if (!hydrated) return;
    AsyncStorage.setItem(storageKey, language).catch(() => undefined);
    try { globalThis.localStorage?.setItem(storageKey, language); } catch { /* AsyncStorage is primary. */ }
  }, [language, hydrated, storageKey]);

  const value = useMemo<WaiterLanguageContextValue>(() => {
    const waiterTranslations = translations[language]?.waiter || translations.es.waiter || {};
    return {
      language,
      hydrated,
      setLanguage: (nextLanguage) => {
        setApiLanguage(nextLanguage);
        void saveUserLanguagePreference(nextLanguage).catch(() => undefined);
        setLanguageState(nextLanguage);
      },
      t: waiterTranslations,
      languageOptions: (['es', 'en', 'pt', 'fr'] as WaiterLanguageCode[]).map((code) => ({
        label: translations[code]?.languageName ?? code,
        value: code,
      })),
    };
  }, [language, hydrated]);

  return <WaiterLanguageContext.Provider value={value}>{children}</WaiterLanguageContext.Provider>;
};

export const useWaiterLanguage = () => {
  const context = useContext(WaiterLanguageContext);
  if (!context) {
    const waiterTranslations = translations.es?.waiter || {};
    return {
      language: DEFAULT_LANGUAGE,
      hydrated: false,
      setLanguage: () => undefined,
      t: waiterTranslations,
      languageOptions: (['es', 'en', 'pt', 'fr'] as WaiterLanguageCode[]).map((code) => ({
        label: translations[code]?.languageName ?? code,
        value: code,
      })),
    };
  }
  return context;
};

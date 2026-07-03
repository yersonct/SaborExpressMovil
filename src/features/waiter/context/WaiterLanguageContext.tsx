import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

const translations = require('../../../locales/translations.json') as Record<string, any>;
export type WaiterLanguageCode = 'es' | 'en' | 'pt' | 'fr';

type WaiterLanguageContextValue = {
  language: WaiterLanguageCode;
  setLanguage: (language: WaiterLanguageCode) => void;
  t: Record<string, string>;
  languageOptions: Array<{ label: string; value: WaiterLanguageCode }>;
};

const STORAGE_KEY = 'saborexpress-language';
const DEFAULT_LANGUAGE: WaiterLanguageCode = 'es';

const WaiterLanguageContext = createContext<WaiterLanguageContextValue | null>(null);

export const WaiterLanguageProvider = ({ children }: { children: React.ReactNode }) => {
  const [language, setLanguageState] = useState<WaiterLanguageCode>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const storedLanguage = globalThis.localStorage?.getItem(STORAGE_KEY) as WaiterLanguageCode | null;
    if (storedLanguage && translations[storedLanguage]?.waiter) {
      setLanguageState(storedLanguage);
    }
  }, []);

  useEffect(() => {
    globalThis.localStorage?.setItem(STORAGE_KEY, language);
  }, [language]);

  const value = useMemo<WaiterLanguageContextValue>(() => {
    const waiterTranslations = translations[language]?.waiter || translations.es.waiter || {};
    return {
      language,
      setLanguage: (nextLanguage) => setLanguageState(nextLanguage),
      t: waiterTranslations,
      languageOptions: (['es', 'en', 'pt', 'fr'] as WaiterLanguageCode[]).map((code) => ({
        label: translations[code]?.languageName ?? code,
        value: code,
      })),
    };
  }, [language]);

  return <WaiterLanguageContext.Provider value={value}>{children}</WaiterLanguageContext.Provider>;
};

export const useWaiterLanguage = () => {
  const context = useContext(WaiterLanguageContext);
  if (!context) {
    const waiterTranslations = translations.es?.waiter || {};
    return {
      language: DEFAULT_LANGUAGE,
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

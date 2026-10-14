import React, { createContext, useCallback, useContext, useRef, useState, ReactNode, useEffect } from "react";
import { setNetworkErrorLanguage } from "@/features/shared/services/networkStatus";
import { getApiLanguage, setApiLanguage } from "@/features/auth/services/apiLanguage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import {
  getUserLanguagePreference,
  saveUserLanguagePreference,
} from "@/features/userPreferences/services/userLanguageService";
import {
  translations,
  LanguageCode,
} from "../../../locales/TableroTranslations";

interface ChefLanguageContextType {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: (typeof translations)["es"];
  languageOptions: { label: string; value: LanguageCode }[];
}

const ChefLanguageContext = createContext<ChefLanguageContextType | undefined>(
  undefined,
);

const LANGUAGE_OPTIONS: { label: string; value: LanguageCode }[] = [
  { label: "Español", value: "es" },
  { label: "English", value: "en" },
  { label: "Português", value: "pt" },
  { label: "Français", value: "fr" },
];

export function ChefLanguageProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userScope = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";
  const [language, setLanguageState] = useState<LanguageCode>(getApiLanguage());
  const languageSelectedBeforeLogin = useRef<LanguageCode>(getApiLanguage());

  useEffect(() => {
    let active = true;
    const initialLanguage = languageSelectedBeforeLogin.current;
    const loadLanguage = async () => {
      try {
        const saved = await getUserLanguagePreference();
        const resolvedLanguage = saved.isConfigured ? saved.language : initialLanguage;
        if (!saved.isConfigured) await saveUserLanguagePreference(resolvedLanguage);
        if (active) {
          setApiLanguage(resolvedLanguage);
          setLanguageState(resolvedLanguage);
        }
      } catch {
        // Keep the language selected on the login screen while offline.
      }
    };
    void loadLanguage();
    return () => { active = false; };
  }, [userScope]);

  useEffect(() => setNetworkErrorLanguage(language), [language]);
  useEffect(() => setApiLanguage(language), [language]);
  const setLanguage = useCallback((nextLanguage: LanguageCode) => {
    setApiLanguage(nextLanguage);
    setLanguageState(nextLanguage);
    void saveUserLanguagePreference(nextLanguage).catch(() => undefined);
  }, []);
  const t = translations[language];

  return (
    <ChefLanguageContext.Provider
      value={{ language, setLanguage, t, languageOptions: LANGUAGE_OPTIONS }}
    >
      {children}
    </ChefLanguageContext.Provider>
  );
}

export function useChefLanguage() {
  const ctx = useContext(ChefLanguageContext);
  if (!ctx)
    throw new Error(
      "useChefLanguage debe usarse dentro de ChefLanguageProvider",
    );
  return ctx;
}

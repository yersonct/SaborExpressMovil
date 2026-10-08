import React, { createContext, useContext, useState, ReactNode } from "react";
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
  const [language, setLanguage] = useState<LanguageCode>("es");
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

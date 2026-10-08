import React, { createContext, useState, useContext, ReactNode } from 'react';
import { LanguageCode } from './../../../locales/CashierTranslations';

type CashierContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
  notificationSound: boolean;
  setNotificationSound: (on: boolean) => void;
};

const CashierContext = createContext<CashierContextType | undefined>(undefined);

// 🔥 SOLUCIÓN: Declaramos explícitamente que es un React.FC (Functional Component)
export const CashierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('es');
  const [isDark, setIsDark] = useState<boolean>(false);
  const [notificationSound, setNotificationSound] = useState<boolean>(true);

  return (
    <CashierContext.Provider
      value={{ language, setLanguage, isDark, setIsDark, notificationSound, setNotificationSound }}
    >
      {children}
    </CashierContext.Provider>
  );
};

export const useCashierContext = () => {
  const context = useContext(CashierContext);
  if (!context) {
    throw new Error('useCashierContext debe usarse dentro de un CashierProvider');
  }
  return context;
};
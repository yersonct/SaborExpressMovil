import React, { createContext, useState, useContext, ReactNode } from 'react';
import { LanguageCode } from '../../../../locales/CashierTranslations';

type CashierContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
};

const CashierContext = createContext<CashierContextType | undefined>(undefined);

// 🔥 SOLUCIÓN: Declaramos explícitamente que es un React.FC (Functional Component)
export const CashierProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('es');
  const [isDark, setIsDark] = useState<boolean>(false);

  return (
    <CashierContext.Provider value={{ language, setLanguage, isDark, setIsDark }}>
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
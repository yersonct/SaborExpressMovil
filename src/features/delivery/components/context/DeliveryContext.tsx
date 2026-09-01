// src/features/delivery/context/DeliveryContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';
import { LanguageCode } from '../../../../locales/DeliveryTranslations';

type DeliveryContextType = {
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  isDark: boolean;
  setIsDark: (dark: boolean) => void;
};

const DeliveryContext = createContext<DeliveryContextType | undefined>(undefined);

export const DeliveryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<LanguageCode>('es');
  const [isDark, setIsDark] = useState<boolean>(false);

  return (
    <DeliveryContext.Provider value={{ language, setLanguage, isDark, setIsDark }}>
      {children}
    </DeliveryContext.Provider>
  );
};

export const useDeliveryContext = () => {
  const context = useContext(DeliveryContext);
  if (!context) {
    throw new Error('useDeliveryContext debe usarse dentro de un DeliveryProvider');
  }
  return context;
};
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type WaiterThemeMode = 'light' | 'dark';

type WaiterTheme = {
  mode: WaiterThemeMode;
  isDark: boolean;
  colors: {
    background: string;
    surface: string;
    elevatedSurface: string;
    header: string;
    card: string;
    text: string;
    mutedText: string;
    border: string;
    divider: string;
    icon: string;
    accent: string;
    accentSoft: string;
    success: string;
    danger: string;
    warning: string;
  };
  setMode: (mode: WaiterThemeMode) => void;
  toggleMode: () => void;
};

const lightColors = {
  background: '#F8FAFC',
  surface: '#FFFFFF',
  elevatedSurface: '#FFFFFF',
  header: '#FFFFFF',
  card: '#FFFFFF',
  text: '#1E293B',
  mutedText: '#64748B',
  border: '#E2E8F0',
  divider: '#F1F5F9',
  icon: '#1E293B',
  accent: '#E61C24',
  accentSoft: '#FEF2F2',
  success: '#10B981',
  danger: '#EF4444',
  warning: '#D97706',
};

const darkColors = {
  background: '#0B1220',
  surface: '#111827',
  elevatedSurface: '#1F2937',
  header: '#111827',
  card: '#111827',
  text: '#FAFAFA',
  mutedText: '#D1D5DB',
  border: '#334155',
  divider: '#334155',
  icon: '#FAFAFA',
  accent: '#F87171',
  accentSoft: '#312020',
  success: '#34D399',
  danger: '#F87171',
  warning: '#FBBF24',
};

const STORAGE_KEY = 'saborexpress-theme';

const WaiterThemeContext = createContext<WaiterTheme | null>(null);

export const WaiterThemeProvider = ({ children }: { children: React.ReactNode }) => {
  const [mode, setModeState] = useState<WaiterThemeMode>('light');

  useEffect(() => {
    const storedTheme = globalThis.localStorage?.getItem(STORAGE_KEY) as WaiterThemeMode | null;
    if (storedTheme === 'light' || storedTheme === 'dark') {
      setModeState(storedTheme);
    }
  }, []);

  useEffect(() => {
    globalThis.localStorage?.setItem(STORAGE_KEY, mode);
  }, [mode]);

  const value = useMemo<WaiterTheme>(() => {
    const isDark = mode === 'dark';
    return {
      mode,
      isDark,
      colors: isDark ? darkColors : lightColors,
      setMode: (nextMode) => setModeState(nextMode),
      toggleMode: () => setModeState((current) => (current === 'dark' ? 'light' : 'dark')),
    };
  }, [mode]);

  return <WaiterThemeContext.Provider value={value}>{children}</WaiterThemeContext.Provider>;
};

export const useWaiterTheme = () => {
  const context = useContext(WaiterThemeContext);
  if (!context) {
    return {
      mode: 'light' as WaiterThemeMode,
      isDark: false,
      colors: lightColors,
      setMode: () => undefined,
      toggleMode: () => undefined,
    };
  }
  return context;
};

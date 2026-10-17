import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";

const darkColors = {
  background: "#0B1220",
  card: "#111827",
  header: "#111827",
  text: "#F8FAFC",
  mutedText: "#CBD5E1",
  border: "#334155",
  divider: "#334155",
  surface: "#111827",
  accent: "#F87171",
};
const lightColors = {
  background: "#F8FAFC",
  card: "#FFFFFF",
  header: "#FFFFFF",
  text: "#1E293B",
  mutedText: "#64748B",
  border: "#E2E8F0",
  divider: "#F1F5F9",
  surface: "#FFFFFF",
  accent: "#E61C24",
};

interface ChefThemeContextType {
  isDark: boolean;
  setMode: (mode: "dark" | "light") => void;
  colors: typeof darkColors;
}

const ChefThemeContext = createContext<ChefThemeContextType | undefined>(
  undefined,
);

export function ChefThemeProvider({ children, storageScope = "anonymous" }: {
  children: ReactNode;
  storageScope?: string;
}) {
  const [isDark, setIsDark] = useState(true);
  const storageKey = `saborexpress-chef-theme:${encodeURIComponent(storageScope)}`;

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(storageKey)
      .then((value) => {
        if (active && (value === "dark" || value === "light")) {
          setIsDark(value === "dark");
        }
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [storageKey]);

  const colors = isDark ? darkColors : lightColors;
  const setMode = (mode: "dark" | "light") => {
    setIsDark(mode === "dark");
    void AsyncStorage.setItem(storageKey, mode).catch(() => undefined);
  };

  return (
    <ChefThemeContext.Provider value={{ isDark, setMode, colors }}>
      {children}
    </ChefThemeContext.Provider>
  );
}

export function useChefTheme() {
  const ctx = useContext(ChefThemeContext);
  if (!ctx)
    throw new Error("useChefTheme debe usarse dentro de ChefThemeProvider");
  return ctx;
}

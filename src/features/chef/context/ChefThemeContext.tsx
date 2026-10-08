import React, { createContext, useContext, useState, ReactNode } from "react";

const darkColors = {
  background: "#0d0e12",
  card: "#15181e",
  header: "#1a1e24",
  text: "#f1f5f9",
  mutedText: "#94a3b8",
  border: "#22252a",
  divider: "#262a30",
  surface: "#1a1e24",
  accent: "#3b82f6",
};
const lightColors = {
  background: "#f0f2f5",
  card: "#ffffff",
  header: "#f8fafc",
  text: "#0f172a",
  mutedText: "#475569",
  border: "#e2e8f0",
  divider: "#cbd5e1",
  surface: "#ffffff",
  accent: "#3b82f6",
};

interface ChefThemeContextType {
  isDark: boolean;
  setMode: (mode: "dark" | "light") => void;
  colors: typeof darkColors;
}

const ChefThemeContext = createContext<ChefThemeContextType | undefined>(
  undefined,
);

export function ChefThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  const colors = isDark ? darkColors : lightColors;
  const setMode = (mode: "dark" | "light") => setIsDark(mode === "dark");

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

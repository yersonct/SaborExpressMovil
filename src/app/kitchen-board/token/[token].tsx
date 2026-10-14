import React from "react";
import { useLocalSearchParams } from "expo-router";
import { ChefThemeProvider } from "@/features/chef/context/ChefThemeContext";
import KitchenBoardPublic from "@/features/chef/components/KitchenBoardPublic";

export default function KitchenBoardScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();

  if (!token) return null;

  return (
    <ChefThemeProvider>
      <KitchenBoardPublic accessToken={token} />
    </ChefThemeProvider>
  );
}

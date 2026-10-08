import React from "react";
import { Stack, Redirect } from "expo-router";
import { View, ActivityIndicator } from "react-native";
import { ChefThemeProvider } from "@/features/chef/context/ChefThemeContext";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";

export default function ChefLayout() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

const effectiveRole = user
  ? resolveEffectiveRole(
      user.roles,
      user.hasActiveShift,
      user.activeShiftRoleName,
    )
  : null;

// Mismo tablero para Cocinero y Auxiliar de Cocina — el modo solo lectura
// del Auxiliar ya lo controla ChefOrders.tsx con canUpdateStatus.
if (
  !effectiveRole ||
  (effectiveRole !== ROLE_NAMES.Cocinero &&
    effectiveRole !== ROLE_NAMES.AuxiliarCocina)
) {
  return <Redirect href="/" />;
}

  return (
    <ChefThemeProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </ChefThemeProvider>
  );
}

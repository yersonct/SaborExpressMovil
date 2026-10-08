import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WaiterThemeProvider } from "@/features/waiter/context/WaiterThemeContext";
import {
  WaiterLanguageProvider,
  useWaiterLanguage,
} from "@/features/waiter/context/WaiterLanguageContext";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole, resolvePrimaryRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";

export default function WaiterTabsLayout() {
  const { user, initializing } = useAuth();

  const WrappedTabs = () => {
    const { t } = useWaiterLanguage();

    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: "#1A1A1A",
            borderTopWidth: 1,
            borderTopColor: "#333333",
            height: 65,
            paddingBottom: 10,
            paddingTop: 5,
          },
          tabBarActiveTintColor: "#E61C24",
          tabBarInactiveTintColor: "#94A3B8",
          tabBarLabelStyle: {
            fontSize: 12,
            fontWeight: "bold",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: t.drawerMain || "Inicio",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="restaurant-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: t.drawerProfile || "Perfil",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="person-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            title: t.drawerSettings || "Ajustes",
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="settings-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    );
  };

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

if (
  !user ||
  resolveEffectiveRole(
    user.roles,
    user.hasActiveShift,
    user.activeShiftRoleName,
  ) !== ROLE_NAMES.Mesero
) {
  return <Redirect href="/" />;
}

  return (
    <WaiterThemeProvider>
      <WaiterLanguageProvider>
        <WrappedTabs />
      </WaiterLanguageProvider>
    </WaiterThemeProvider>
  );
}

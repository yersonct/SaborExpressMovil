import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { UserNotificationsProvider } from "../../features/notifications/context/UserNotificationsContext";

export default function ClientTabsLayout() {
  const { user, initializing } = useAuth();

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
    ) !== ROLE_NAMES.Cliente
  ) {
    return <Redirect href="/" />;
  }

  return (
    <UserNotificationsProvider>
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
        tabBarLabelStyle: { fontSize: 12, fontWeight: "bold" },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Menú",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Ruta que existe pero NO debe salir como pestaña */}
      <Tabs.Screen name="addresses" options={{ href: null }} />
    </Tabs>
    </UserNotificationsProvider>
  );
}

import React from "react";
import { View, ActivityIndicator, StatusBar } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { getUserIdFromToken } from "../../features/auth/services/decodeToken";
import { UserNotificationsProvider } from "../../features/notifications/context/UserNotificationsContext";
import { ClientPreferencesProvider, useClientPreferences } from "../../features/userPreferences/context/ClientPreferencesContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_TYPOGRAPHY } from "@/features/shared/theme/mobileTypography";

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
    <ClientPreferencesProvider
      key={String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())}
    >
      <UserNotificationsProvider>
        <ClientTabs />
      </UserNotificationsProvider>
    </ClientPreferencesProvider>
  );
}

function ClientTabs() {
  const { colors, isDark, hydrated, t } = useClientPreferences();
  const insets = useSafeAreaInsets();
  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
        <StatusBar barStyle={isDark ? "light-content" : "dark-content"} backgroundColor={colors.background} />
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }
  return (
    <>
    <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarStyle: {
          backgroundColor: isDark ? colors.surface : "#FFFFFF",
          borderTopWidth: 1,
          borderTopColor: colors.border,
          height: 60 + insets.bottom,
          paddingBottom: Math.max(insets.bottom, 6),
          paddingTop: 5,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: MOBILE_TYPOGRAPHY.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("menu"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fast-food-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: t("settings"),
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Ruta que existe pero NO debe salir como pestaña */}
      <Tabs.Screen name="addresses" options={{ href: null }} />
    </Tabs>
    </>
  );
}

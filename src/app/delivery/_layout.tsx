import React from "react";
import { StyleSheet, Platform, View, ActivityIndicator } from "react-native";
import { Tabs, useRouter, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  DeliveryProvider,
  useDeliveryContext,
} from "../../features/delivery/components/context/DeliveryContext";
import { TRANSLATIONS, LanguageCode } from "../../locales/DeliveryTranslations";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole, resolvePrimaryRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { UserNotificationsProvider } from "../../features/notifications/context/UserNotificationsContext";

function DeliveryTabs() {
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { language, isDark } = useDeliveryContext();

  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];

  const tabBarBg = isDark ? "#1E293B" : "#FFFFFF";
  const tabBarBorder = isDark ? "#334155" : "#E2E8F0";
  const inactiveColor = isDark ? "#64748B" : "#94A3B8";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          { backgroundColor: tabBarBg, borderTopColor: tabBarBorder },
        ],
        tabBarActiveTintColor: "#E61C24",
        tabBarInactiveTintColor: inactiveColor,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: { paddingVertical: Platform.OS === "ios" ? 0 : 5 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome || "EnvÃ­os",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bicycle-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        options={{
          title: t.tabProfile || "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="settings"
        options={{
          title: t.tabSettings || "Ajustes",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          href: null,
          title: t.tabLogout || "Salir",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="log-out-outline" size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            e.preventDefault();
            handleLogout()
              .catch(() => {})
              .finally(() => router.replace("/"));
          },
        })}
      />
    </Tabs>
  );
}

export default function DeliveryTabsLayout() {
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
  resolveEffectiveRole(user.roles, user.hasActiveShift, user.activeShiftRoleName) !==
    ROLE_NAMES.Repartidor
) {
  return <Redirect href="/" />;
}

  return (
    <DeliveryProvider>
      <UserNotificationsProvider>
        <DeliveryTabs />
      </UserNotificationsProvider>
    </DeliveryProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: Platform.OS === "ios" ? 85 : 65,
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
    paddingTop: 8,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: "600",
  },
});


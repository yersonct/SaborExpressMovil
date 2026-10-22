import React from "react";
import { StyleSheet, Platform, View, ActivityIndicator, StatusBar } from "react-native";
import { Tabs, useRouter, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_TYPOGRAPHY } from "@/features/shared/theme/mobileTypography";

import {
  DeliveryProvider,
  useDeliveryContext,
} from "../../features/delivery/components/context/DeliveryContext";
import { TRANSLATIONS, LanguageCode } from "../../locales/DeliveryTranslations";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { UserNotificationsProvider } from "../../features/notifications/context/UserNotificationsContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { DeliveryPushNotificationRegistration } from "@/features/delivery/components/DeliveryPushNotificationRegistration";
import { getDeliveryTheme } from "../../features/delivery/components/context/deliveryTheme";

function DeliveryTabs() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { handleLogout } = useAuth();
  const { language, isDark } = useDeliveryContext();

  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];

  const colors = getDeliveryTheme(isDark);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [
          styles.tabBar,
          {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 8),
          },
        ],
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: isDark ? colors.muted : "#94A3B8",
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

function DeliveryReadyContent() {
  const { isDark, preferencesHydrated } = useDeliveryContext();
  const colors = getDeliveryTheme(isDark);
  if (!preferencesHydrated) {
    return (
      <>
        <StatusBar
          barStyle={isDark ? "light-content" : "dark-content"}
          backgroundColor={colors.background}
        />
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      </>
    );
  }

  return (
    <>
      <StatusBar
        barStyle={isDark ? "light-content" : "dark-content"}
        backgroundColor={colors.background}
      />
      <DeliveryPushNotificationRegistration />
      <UserNotificationsProvider>
        <DeliveryTabs />
      </UserNotificationsProvider>
    </>
  );
}

export default function DeliveryTabsLayout() {
  const { user, initializing } = useAuth();
  const preferenceScope = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";

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
    <DeliveryProvider key={preferenceScope} storageScope={preferenceScope}>
      <DeliveryReadyContent />
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
  tabLabel: { ...MOBILE_TYPOGRAPHY.tabLabel },
});


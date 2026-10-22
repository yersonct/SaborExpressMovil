import React from "react";
import { View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { WaiterThemeProvider , useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { WaiterNotificationPreferencesProvider } from "@/features/waiter/context/WaiterNotificationPreferencesContext";
import {
  WaiterLanguageProvider,
  useWaiterLanguage,
} from "@/features/waiter/context/WaiterLanguageContext";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MOBILE_TYPOGRAPHY } from "@/features/shared/theme/mobileTypography";
import { WaiterPushNotificationRegistration } from "@/features/waiter/components/WaiterPushNotificationRegistration";
import { AppAlertModal } from "@/features/shared/components/AppAlertModal";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";

function WaiterAppAlertModal() {
  const { colors } = useWaiterTheme();

  return (
    <AppAlertModal
      colors={{
        surface: colors.surface,
        text: colors.text,
        mutedText: colors.mutedText,
        accent: colors.accent,
        accentSoft: colors.accentSoft,
        danger: colors.danger,
        border: colors.border,
        elevatedSurface: colors.elevatedSurface,
      }}
    />
  );
}

function WrappedTabs() {
    const { t, hydrated } = useWaiterLanguage();
    const { colors } = useWaiterTheme();
    const insets = useSafeAreaInsets();

    if (!hydrated) {
      return (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: colors.background }}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      );
    }

    return (
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: Math.max(insets.bottom, 6),
            paddingTop: 5,
          },
          tabBarActiveTintColor: colors.accent,
          tabBarInactiveTintColor: colors.mutedText,
          tabBarLabelStyle: MOBILE_TYPOGRAPHY.tabLabel,
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
}

export default function WaiterTabsLayout() {
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
  resolveEffectiveRole(
    user.roles,
    user.hasActiveShift,
    user.activeShiftRoleName,
  ) !== ROLE_NAMES.Mesero
) {
  return <Redirect href="/" />;
}

  return (
    <WaiterThemeProvider key={preferenceScope} storageScope={preferenceScope}>
      <WaiterLanguageProvider storageScope={preferenceScope}>
        <WaiterNotificationPreferencesProvider storageScope={preferenceScope}>
          <WaiterPushNotificationRegistration />
          <WaiterAppAlertModal />
          <WrappedTabs />
        </WaiterNotificationPreferencesProvider>
      </WaiterLanguageProvider>
    </WaiterThemeProvider>
  );
}

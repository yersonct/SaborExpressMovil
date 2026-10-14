import { StyleSheet, View, ActivityIndicator } from "react-native";
import { Tabs, Redirect } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  CashierProvider,
  useCashierContext,
} from "../../features/cashier/context/CashierContext";
import { TRANSLATIONS, LanguageCode } from "../../locales/CashierTranslations";
import { useAuth } from "../../features/auth/context/AuthContext";
import { resolveEffectiveRole, resolvePrimaryRole } from "../../features/auth/services/roleMap";
import { ROLE_NAMES } from "../../features/auth/types/role";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { CashierPushNotificationRegistration } from "@/features/cashier/components/CashierPushNotificationRegistration";

function CashierTabs() {

  const { language, isDark } = useCashierContext();
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
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t.tabHome || "Caja",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="cash-outline" size={size} color={color} />
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
    </Tabs>
  );
}

function CashierReadyContent() {
  const { hydrated, isDark } = useCashierContext();

  if (!hydrated) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: isDark ? "#0B1220" : "#F8FAFC" }}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

  return (
    <>
      <CashierPushNotificationRegistration />
      <CashierTabs />
    </>
  );
}

export default function CashierTabsLayout() {
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

  // Sin sesión, o con sesión pero de un rol distinto a Cajero → afuera.
if (
  !user ||
  resolveEffectiveRole(
    user.roles,
    user.hasActiveShift,
    user.activeShiftRoleName,
  ) !== ROLE_NAMES.Cajero
) {
  return <Redirect href="/" />;
}

  return (
    <CashierProvider key={preferenceScope}>
      <CashierReadyContent />
    </CashierProvider>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 60,
    paddingBottom: 8,
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

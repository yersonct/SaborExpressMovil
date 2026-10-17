import React, { useEffect, useState } from "react";
import {
  StyleSheet,
  StatusBar,
  View,
  ActivityIndicator,
} from "react-native";
import { Redirect } from "expo-router";
import { readLastVisitedRoute, routeStorageScope } from "@/features/shared/services/lastVisitedRoute";
import { LoginForm } from "../features/auth/components/LoginForm";
import { useAuth } from "../features/auth/context/AuthContext";
import {
  ROLE_ROUTES,
  resolveEffectiveRole,
  resolvePrimaryRole,
} from "../features/auth/services/roleMap";

export default function IndexScreen() {
  const { user, initializing } = useAuth();
  const [restored, setRestored] = useState<{ scope: string; base: string; path: string } | null>(null);
  const effectiveRole = user
    ? resolveEffectiveRole(user.roles, user.hasActiveShift, user.activeShiftRoleName)
    : null;
  const base = effectiveRole ? ROLE_ROUTES[effectiveRole] : null;
  const scope = user ? routeStorageScope(user) : null;
  useEffect(() => {
    if (!base || !scope) return;
    let active = true;
    void readLastVisitedRoute(scope, base).then((path) => {
      if (active) setRestored({ scope, base, path });
    });
    return () => { active = false; };
  }, [base, scope]);

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

  if (user && base && scope) {
    if (!restored || restored.scope !== scope || restored.base !== base) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#E61C24" />
        </View>
      );
    }
    return <Redirect href={restored.path as any} />;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LoginForm />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f5f5f5", justifyContent: "center" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f5f5",
  },
});

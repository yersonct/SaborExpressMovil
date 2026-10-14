import React from "react";
import {
  StyleSheet,
  StatusBar,
  View,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { LoginForm } from "../features/auth/components/LoginForm";
import { useAuth } from "../features/auth/context/AuthContext";
import {
  ROLE_ROUTES,
  resolveEffectiveRole,
  resolvePrimaryRole,
} from "../features/auth/services/roleMap";

export default function IndexScreen() {
  const { user, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

 if (user) {
   const effectiveRole = resolveEffectiveRole(
     user.roles,
     user.hasActiveShift,
     user.activeShiftRoleName,
   );
   const route = ROLE_ROUTES[effectiveRole];
   if (route) {
     return <Redirect href={route as any} />;
   }
 }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <LoginForm />
    </SafeAreaView>
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

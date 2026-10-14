import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { subscribeToNetworkStatus } from "../services/networkStatus";

export function NetworkConnectionBanner() {
  const [message, setMessage] = useState<string | null>(null);
  const insets = useSafeAreaInsets();

  useEffect(() => subscribeToNetworkStatus(setMessage), []);

  if (!message) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.container, { top: Math.max(10, insets.top + 8) }]}
    >
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={styles.banner}>
        <Ionicons name="cloud-offline-outline" size={22} color="#FFFFFF" />
        <Text style={styles.message}>{message}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Cerrar aviso de conexión"
          hitSlop={10}
          onPress={() => setMessage(null)}
        >
          <Ionicons name="close" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 2000,
    elevation: 20,
  },
  banner: {
    minHeight: 54,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#B42318",
    shadowColor: "#000000",
    shadowOpacity: 0.22,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  message: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
});


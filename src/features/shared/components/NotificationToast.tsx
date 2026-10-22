import React, { useCallback, useEffect, useState } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useOptionalClientPreferences } from "@/features/userPreferences/context/ClientPreferencesContext";
import { localizeClientNotification } from "@/features/notifications/utils/localizeClientNotification";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { translateMobileCopy } from "../../../locales/mobileCopy";

export interface ToastNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
  createdAt?: string;
  isRead?: boolean;
  deliveryId?: number;
  latitude?: number;
  longitude?: number;
  updatedAt?: string;
}

interface Props {
  notifications: ToastNotification[];
  onDismiss: (id: number) => void;
  onSelect?: (notification: ToastNotification) => void;
  t?: (key: string) => string;
  colors?: {
    surface: string;
    text: string;
    mutedText: string;
    border: string;
  };
}

const ICONS: Record<
  string,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  OrderReady: { name: "checkmark-circle", color: "#22C55E" },
  OrderInPreparation: { name: "flame", color: "#F59E0B" },
  PaymentConfirmed: { name: "card", color: "#10B981" },
  TableAvailable: { name: "checkmark-circle", color: "#22C55E" },
  DeliveryAssigned: { name: "bicycle", color: "#3B82F6" },
  OrderStatusChanged: { name: "refresh-circle", color: "#F59E0B" },
  Default: { name: "notifications", color: "#3B82F6" },
};

function ToastItem({
  notification,
  onDismiss,
  onSelect,
  t,
  colors,
}: {
  notification: ToastNotification;
  onDismiss: (id: number) => void;
  onSelect?: (notification: ToastNotification) => void;
  t?: (key: string) => string;
  colors?: Props["colors"];
}) {
  const [translateY] = useState(() => new Animated.Value(-80));
  const [opacity] = useState(() => new Animated.Value(0));
  const icon = ICONS[notification.type] || ICONS.Default;
  const displayNotification = localizeClientNotification(notification, t);

  const handleDismiss = useCallback(() => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -80,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss(notification.id));
  }, [notification.id, onDismiss, opacity, translateY]);

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        friction: 8,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => handleDismiss(), 4500);
    return () => clearTimeout(timer);
  }, [handleDismiss, opacity, translateY]);

  return (
    <Animated.View
      style={[
        styles.toast,
        colors && {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 1,
        },
        { transform: [{ translateY }], opacity },
      ]}
    >
      <TouchableOpacity
        style={styles.toastBody}
        accessibilityRole="button"
        accessibilityLabel={translateMobileCopy("Abrir pedido de esta notificación")}
        disabled={!(notification.relatedEntityType?.toLowerCase() === "order" && notification.relatedEntityId && onSelect)}
        onPress={() => { onSelect?.(notification); handleDismiss(); }}
      >
      <View style={[styles.iconBox, { backgroundColor: icon.color + "22" }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.textBox}>
        <Text style={[styles.title, colors && { color: colors.text }]} numberOfLines={1}>
          {displayNotification.title}
        </Text>
        <Text style={[styles.message, colors && { color: colors.mutedText }]} numberOfLines={2}>
          {displayNotification.message}
        </Text>
      </View>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color={colors?.mutedText ?? "#94A3B8"} />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
  onSelect,
  t,
  colors,
}: Props) {
  const preferences = useOptionalClientPreferences();
  const insets = useSafeAreaInsets();
  if (notifications.length === 0) return null;

  return (
    <View
      style={[styles.container, { top: Math.max(10, insets.top + 10) }]}
      pointerEvents="box-none"
    >
      {notifications.map((n) => (
        <ToastItem
          key={n.id}
          notification={n}
          onDismiss={onDismiss}
          onSelect={onSelect}
          t={t ?? preferences?.t}
          colors={colors}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    left: 12,
    right: 12,
    zIndex: 999,
    gap: 8,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1F2937",
    borderRadius: 12,
    padding: 12,
    gap: 10,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastBody: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  textBox: {
    flex: 1,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
  message: {
    color: "#CBD5E1",
    fontSize: 12,
    marginTop: 2,
  },
});

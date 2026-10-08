import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export interface ToastNotification {
  id: number;
  title: string;
  message: string;
  type: string;
  relatedEntityType?: string | null;
  relatedEntityId?: number | null;
}

interface Props {
  notifications: ToastNotification[];
  onDismiss: (id: number) => void;
}

const ICONS: Record<
  string,
  { name: keyof typeof Ionicons.glyphMap; color: string }
> = {
  OrderReady: { name: "checkmark-circle", color: "#22C55E" },
  OrderInPreparation: { name: "flame", color: "#F59E0B" },
  PaymentConfirmed: { name: "card", color: "#10B981" },
  DeliveryAssigned: { name: "bicycle", color: "#3B82F6" },
  OrderStatusChanged: { name: "refresh-circle", color: "#F59E0B" },
  Default: { name: "notifications", color: "#3B82F6" },
};

function ToastItem({
  notification,
  onDismiss,
}: {
  notification: ToastNotification;
  onDismiss: (id: number) => void;
}) {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const icon = ICONS[notification.type] || ICONS.Default;

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
  }, []);

  const handleDismiss = () => {
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
  };

  return (
    <Animated.View
      style={[styles.toast, { transform: [{ translateY }], opacity }]}
    >
      <View style={[styles.iconBox, { backgroundColor: icon.color + "22" }]}>
        <Ionicons name={icon.name} size={22} color={icon.color} />
      </View>
      <View style={styles.textBox}>
        <Text style={styles.title} numberOfLines={1}>
          {notification.title}
        </Text>
        <Text style={styles.message} numberOfLines={2}>
          {notification.message}
        </Text>
      </View>
      <TouchableOpacity onPress={handleDismiss} hitSlop={10}>
        <Ionicons name="close" size={18} color="#94A3B8" />
      </TouchableOpacity>
    </Animated.View>
  );
}

export function NotificationToastContainer({
  notifications,
  onDismiss,
}: Props) {
  if (notifications.length === 0) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((n) => (
        <ToastItem key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 10,
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

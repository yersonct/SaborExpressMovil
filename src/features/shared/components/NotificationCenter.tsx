import React, { useState } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  FlatList,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { ToastNotification } from "./NotificationToast";
import { showAppAlert } from "../services/alertEvents";
import { localizeClientNotification } from "@/features/notifications/utils/localizeClientNotification";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  notifications: ToastNotification[];
  unreadCount: number;
  onOpen: () => void;
  onClear: () => void;
  onSelect?: (notification: ToastNotification) => void;
  colors?: { background: string; surface: string; elevated: string; text: string; muted: string; border: string; accent: string };
  t?: (key: string) => string;
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

export function NotificationCenter({
  notifications,
  unreadCount,
  onOpen,
  onClear,
  onSelect,
  colors,
  t,
}: Props) {
  const [visible, setVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const handleRowPress = (item: ToastNotification) => {
    setVisible(false);
    onSelect?.(item);
  };

  const handleClearPress = () => {
    // Cerramos primero el panel de notificaciones y DESPUÉS mostramos la
    // confirmación. Con dos <Modal> de RN abiertos a la vez, en web cada uno
    // crea su propia capa independiente y no se apilan de forma confiable
    // con zIndex — cerrando este antes evita el conflicto por completo.
    setVisible(false);
    setTimeout(() => {
      showAppAlert(
        t?.("clearNotificationsTitle") ?? "¿Eliminar notificaciones?",
        t?.("clearNotificationsMessage") ?? "Se eliminarán todas las notificaciones de esta lista. Esta acción no se puede deshacer.",
        [
          { text: t?.("cancel") ?? "Cancelar", style: "cancel" },
          { text: t?.("yesDelete") ?? "Sí, eliminar", style: "destructive", onPress: onClear },
        ],
      );
    }, 200);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.bellButton, colors && { backgroundColor: colors.elevated }]}
        onPress={() => {
          setVisible(true);
          onOpen();
        }}
      >
        <Ionicons name="notifications-outline" size={24} color={colors?.text ?? "#1E293B"} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {unreadCount > 9 ? "9+" : unreadCount}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal
        visible={visible}
        animationType="slide"
        transparent
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} style={[styles.sheet, { paddingBottom: Math.max(16, insets.bottom) }, colors && { backgroundColor: colors.surface }]}>
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, colors && { color: colors.text }]}>{t?.("notificationTitle") ?? "Notificaciones"}</Text>
              <View style={{ flexDirection: "row", gap: 16 }}>
                {notifications.length > 0 && (
                  <TouchableOpacity onPress={handleClearPress}>
                    <Text style={[styles.clearText, colors && { color: colors.accent }]}>{t?.("clear") ?? "Limpiar"}</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setVisible(false)}>
                  <Ionicons name="close" size={22} color={colors?.muted ?? "#64748B"} />
                </TouchableOpacity>
              </View>
            </View>

            {notifications.length === 0 ? (
              <View style={styles.emptyBox}>
                <Ionicons
                  name="notifications-off-outline"
                  size={32}
                  color="#CBD5E1"
                />
                    <Text style={[styles.emptyText, colors && { color: colors.muted }]}>
                  {t?.("noNotifications") ?? "Sin notificaciones por ahora"}
                </Text>
              </View>
            ) : (
              <FlatList
                data={[...notifications].sort((a, b) => Number(b.id) - Number(a.id))}
                keyExtractor={(item) => String(item.id)}
                style={{ flexShrink: 1, maxHeight: 420 }}
                renderItem={({ item }) => {
                  const icon = ICONS[item.type] || ICONS.Default;
                  const displayItem = localizeClientNotification(item, t);
                  const isTappable =
                    item.relatedEntityType === "Order" &&
                    !!item.relatedEntityId;
                  return (
                    <TouchableOpacity
                      style={[styles.row, colors && { borderBottomColor: colors.border }]}
                      activeOpacity={isTappable ? 0.6 : 1}
                      disabled={!isTappable}
                      onPress={() => handleRowPress(item)}
                    >
                      <View
                        style={[
                          styles.iconBox,
                          { backgroundColor: icon.color + "22" },
                        ]}
                      >
                        <Ionicons
                          name={icon.name}
                          size={18}
                          color={icon.color}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, colors && { color: colors.text }]}>{displayItem.title}</Text>
                        <Text style={[styles.rowMessage, colors && { color: colors.muted }]}>{displayItem.message}</Text>
                      </View>
                      {isTappable && (
                        <Ionicons
                          name="chevron-forward"
                          size={16}
                          color="#CBD5E1"
                        />
                      )}
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  bellButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F1F5F9",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#E61C24",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
  },
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#FFF",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 16,
    maxHeight: "82%",
  },
  sheetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1E293B",
  },
  clearText: {
    color: "#E61C24",
    fontWeight: "600",
    fontSize: 13,
  },
  emptyBox: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    color: "#94A3B8",
    fontSize: 13,
  },
  row: {
    flexDirection: "row",
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
  },
  rowTitle: {
    fontWeight: "700",
    fontSize: 13,
    color: "#1E293B",
  },
  rowMessage: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 2,
  },
});

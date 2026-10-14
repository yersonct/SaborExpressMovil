import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { getDeliveryTheme } from "./context/deliveryTheme";

type Props = {
  visible: boolean;
  loading?: boolean;
  isCash: boolean;
  amount?: string; // ya formateado, ej: "$25.000"
  isDark?: boolean;
  t: Record<string, any>;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeliveryModal({
  visible,
  loading = false,
  isCash,
  amount,
  isDark = false,
  t,
  onCancel,
  onConfirm,
}: Props) {
  const colors = getDeliveryTheme(isDark);

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[s.title, { color: colors.text }]}>{t.confirmDelivery}</Text>
          <Text style={[s.message, { color: colors.muted }]}>
            {isCash
              ? t.confirmCashReceivedMessage(amount)
              : t.confirmDeliveredMessage}
          </Text>

          <View style={s.row}>
            <TouchableOpacity
              style={[s.btn, s.cancel, { backgroundColor: colors.elevated }]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={[s.cancelText, { color: colors.text }]}>{t.cancelBtn || t.cancel}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, s.confirm, { backgroundColor: colors.accent }, loading && { opacity: 0.6 }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.confirmText}>
                  {isCash ? t.confirmCashReceived : t.confirmDelivered}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    padding: 24,
  },
  card: { borderRadius: 16, padding: 20, borderWidth: 1 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  message: { fontSize: 15, lineHeight: 21, marginBottom: 20 },
  row: { flexDirection: "row", gap: 10 },
  btn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  cancel: {},
  cancelText: { fontWeight: "700" },
  confirm: {},
  confirmText: { color: "#FFFFFF", fontWeight: "700" },
});

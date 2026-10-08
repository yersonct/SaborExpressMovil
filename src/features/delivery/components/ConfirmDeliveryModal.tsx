import React from "react";
import {
  ActivityIndicator,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Props = {
  visible: boolean;
  loading?: boolean;
  isCash: boolean;
  amount?: string; // ya formateado, ej: "$25.000"
  isDark?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmDeliveryModal({
  visible,
  loading = false,
  isCash,
  amount,
  isDark = false,
  onCancel,
  onConfirm,
}: Props) {
  const card = isDark ? "#1E293B" : "#FFFFFF";
  const text = isDark ? "#F8FAFC" : "#1E293B";
  const muted = isDark ? "#94A3B8" : "#64748B";

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
    >
      <View style={s.overlay}>
        <View style={[s.card, { backgroundColor: card }]}>
          <Text style={[s.title, { color: text }]}>Confirmar entrega</Text>
          <Text style={[s.message, { color: muted }]}>
            {isCash
              ? `¿Confirma que entregó el pedido y recibió el efectivo${amount ? ` (${amount})` : ""}?`
              : "¿Confirma que entregó el pedido al cliente?"}
          </Text>

          <View style={s.row}>
            <TouchableOpacity
              style={[s.btn, s.cancel]}
              onPress={onCancel}
              disabled={loading}
            >
              <Text style={s.cancelText}>Cancelar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[s.btn, s.confirm, loading && { opacity: 0.6 }]}
              onPress={onConfirm}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={s.confirmText}>
                  {isCash ? "Sí, efectivo recibido" : "Sí, entregado"}
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
  card: { borderRadius: 16, padding: 20 },
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
  cancel: { backgroundColor: "#E2E8F0" },
  cancelText: { color: "#334155", fontWeight: "700" },
  confirm: { backgroundColor: "#10B981" },
  confirmText: { color: "#FFFFFF", fontWeight: "700" },
});

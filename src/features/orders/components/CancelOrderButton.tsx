import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import { orderService } from "../services/orderService";
import { canCustomerCancel, type OrderSummary } from "../types/order.types";

interface Props {
  order: OrderSummary;
  onCancelled?: () => void;
}

export function CancelOrderButton({ order, onCancelled }: Props) {
  const [loading, setLoading] = useState(false);

  if (!canCustomerCancel(order)) {
    return (
      <Text style={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>
        {order.isFullyPaid
          ? "Pedido pagado: ya no se puede cancelar desde la app."
          : "Tu pedido ya está en preparación y no se puede cancelar."}
      </Text>
    );
  }

  const confirm = () =>
    Alert.alert(
      "Cancelar pedido",
      "¿Seguro que quieres cancelar este pedido?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Sí, cancelar",
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              await orderService.cancelMine(order.id);
              onCancelled?.();
            } catch (err: any) {
              Alert.alert(
                "No se pudo cancelar",
                err?.message ?? "Intenta de nuevo.",
              );
              onCancelled?.(); // refresca: puede que cocina ya lo haya empezado
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );

  return (
    <TouchableOpacity
      onPress={confirm}
      disabled={loading}
      style={{
        padding: 12,
        borderRadius: 10,
        alignItems: "center",
        backgroundColor: "#FEE2E2",
        opacity: loading ? 0.6 : 1,
      }}
    >
      {loading ? (
        <ActivityIndicator color="#DC2626" />
      ) : (
        <Text style={{ color: "#DC2626", fontWeight: "700" }}>
          Cancelar pedido
        </Text>
      )}
    </TouchableOpacity>
  );
}

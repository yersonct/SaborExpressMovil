import React, { useState } from "react";
import { ActivityIndicator, Alert, Text, TouchableOpacity } from "react-native";
import { orderService } from "../services/orderService";
import { canCustomerCancel, type OrderSummary } from "../types/order.types";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { ReasonPromptModal } from "@/features/shared/components/ReasonPromptModal";

interface Props {
  order: OrderSummary;
  onCancelled?: () => void;
}

export function CancelOrderButton({ order, onCancelled }: Props) {
  const [loading, setLoading] = useState(false);
  const [reasonVisible, setReasonVisible] = useState(false);
  const [reason, setReason] = useState("");

  if (!canCustomerCancel(order)) {
    return (
      <Text style={{ color: "#64748B", fontSize: 12, textAlign: "center" }}>
        {translateMobileCopy(order.isFullyPaid
          ? "Pedido pagado: ya no se puede cancelar desde la app."
          : "Tu pedido ya está en preparación y no se puede cancelar.")}
      </Text>
    );
  }

  const confirm = () =>
    Alert.alert(
      translateMobileCopy("Cancelar pedido"),
      translateMobileCopy("¿Seguro que quieres cancelar este pedido?"),
      [
        { text: translateMobileCopy("No"), style: "cancel" },
        {
          text: translateMobileCopy("Sí, cancelar"),
          style: "destructive",
          onPress: () => {
            setReason("");
            setReasonVisible(true);
          },
        },
      ],
    );

  const submitCancellation = async () => {
    if (reason.trim().length < 3 || loading) return;
    setLoading(true);
    try {
      await orderService.cancelMine(order.id, reason.trim());
      setReasonVisible(false);
      onCancelled?.();
    } catch (err: any) {
      Alert.alert(
        translateMobileCopy("No se pudo cancelar"),
        translateMobileCopy(err?.message ?? "Intenta de nuevo."),
      );
      onCancelled?.();
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
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
            {translateMobileCopy("Cancelar pedido")}
          </Text>
        )}
      </TouchableOpacity>
      <ReasonPromptModal
        visible={reasonVisible}
        title={translateMobileCopy("Motivo de cancelación")}
        description={translateMobileCopy("Indica por qué cancelas el pedido o retiras el producto. El motivo se guardará en el historial.")}
        placeholder={translateMobileCopy("Escribe el motivo")}
        cancelLabel={translateMobileCopy("Volver")}
        confirmLabel={translateMobileCopy("Continuar")}
        value={reason}
        onChangeText={setReason}
        onCancel={() => { if (!loading) setReasonVisible(false); }}
        onConfirm={() => void submitCancellation()}
        busy={loading}
      />
    </>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { orderService } from "@/features/orders/services/orderService";
import { paymentService } from "@/features/payments/services/paymentService";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/features/payments/types/payment.types";
import {
  OrderStatus,
  OrderType,
  OrderSummary,
} from "@/features/orders/types/order.types";
import { styles } from "../style/CashierStyles";

interface Props {
  branchId: number | null;
  isDark: boolean;
  showToast: (message: string) => void;
  refreshKey?: number;
}
const POLL_INTERVAL_MS = 15000;

// Un domicilio con pago Wompi solo es visible para el cajero cuando ese pago
// está Completed. Si el pago está Pending o Failed, se oculta.
// Los de efectivo (sin pagos Wompi) se muestran normal.
export async function isReadyForCashier(order: OrderSummary): Promise<boolean> {
  try {
    const payments = await paymentService.getByOrder(order.id);
    const wompiPayments = payments.filter(
      (p) => p.method === PaymentMethod.Wompi,
    );
    if (wompiPayments.length === 0) return true;
    return wompiPayments.some((p) => p.status === PaymentStatus.Completed);
  } catch {
    // Si no se puede verificar el pago, mejor no mostrarlo todavía.
    return false;
  }
}
export function DeliveryOrdersPanel({
  branchId,
  isDark,
  showToast,
  refreshKey = 0,
}: Props) {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const colors = {
    background: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
  };

  const fetchPendingDeliveries = useCallback(
    async (silent = false) => {
      if (!branchId) {
        setOrders([]);
        setLoading(false);
        return;
      }
      if (!silent) setLoading(true);
      try {
        let summaries = await orderService.getAll(branchId);
        const todayStr = new Date().toDateString();

        // Domicilios de hoy esperando pago: se verifica con Wompi
        const waitingPayment = summaries.filter(
          (o) =>
            o.orderType === OrderType.Delivery &&
            o.status === OrderStatus.Pending &&
            o.orderDetails.length > 0 &&
            new Date(o.createdAt).toDateString() === todayStr,
        );
        const synced = await Promise.all(waitingPayment.map(syncPendingWompi));
        if (synced.some(Boolean)) {
          // Alguno se aprobó: se recarga para verlo ya confirmado y con repartidor
          summaries = await orderService.getAll(branchId);
        }
        const candidates = summaries.filter(
          (o) =>
            o.orderType === OrderType.Delivery &&
            o.status === OrderStatus.Pending &&
            o.orderDetails.length > 0 &&
            new Date(o.createdAt).toDateString() === todayStr,
        );

        // Solo los de efectivo o los que Wompi ya aprobó
        const checks = await Promise.all(candidates.map(isReadyForCashier));
        setOrders(candidates.filter((_, i) => checks[i]));

        // Domicilios ya confirmados hoy (incluye los pagados con Wompi)
        const today = new Date().toDateString();
        setConfirmedOrders(
          summaries.filter(
            (o) =>
              o.orderType === OrderType.Delivery &&
              (o.status === OrderStatus.Confirmed ||
                o.status === OrderStatus.InPreparation ||
                o.status === OrderStatus.Ready) &&
              new Date(o.createdAt).toDateString() === today,
          ),
        );
      } catch (err: any) {
        if (!silent) {
          Alert.alert(
            "Error",
            err?.message ?? "No se pudieron cargar los pedidos de domicilio.",
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [branchId],
  );

  useEffect(() => {
    fetchPendingDeliveries();
  }, [fetchPendingDeliveries, refreshKey]);

  // Refresco automático: el pedido aparece solo cuando Wompi confirma el pago
  useEffect(() => {
    const interval = setInterval(
      () => fetchPendingDeliveries(true),
      POLL_INTERVAL_MS,
    );
    return () => clearInterval(interval);
  }, [fetchPendingDeliveries]);

  const handleConfirm = async (order: OrderSummary) => {
    setConfirmingId(order.id);
    try {
      await orderService.updateStatus(order.id, OrderStatus.Confirmed);

      // El backend asigna el repartidor al confirmar: releemos el pedido
      // para saber si quedó alguien asignado.
      let driver: string | null = null;
      try {
        const fresh = await orderService.getById(order.id);
        driver = fresh.assignedDeliveryPersonName;
      } catch {}

      if (driver) {
        showToast(`✅ Pedido #${order.id} confirmado — repartidor: ${driver}`);
      } else {
        Alert.alert(
          "Pedido confirmado sin repartidor",
          "No hay repartidores disponibles en esta sede. Avisa al gerente para asignarlo manualmente.",
        );
      }
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setConfirmedOrders((prev) => [
        { ...order, status: OrderStatus.Confirmed },
        ...prev,
      ]);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo confirmar el pedido.");
    } finally {
      setConfirmingId(null);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#E61C24" />
      </View>
    );
  }

  return (
    <FlatList
      data={orders}
      keyExtractor={(item) => String(item.id)}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      onRefresh={() => fetchPendingDeliveries()}
      extraData={confirmedOrders}
      refreshing={loading}
      ListFooterComponent={
        confirmedOrders.length > 0 ? (
          <View style={{ marginTop: 8, gap: 12 }}>
            <Text
              style={{ color: colors.muted, fontWeight: "700", fontSize: 13 }}
            >
              CONFIRMADOS HOY ({confirmedOrders.length})
            </Text>
            {confirmedOrders.map((o) => (
              <View
                key={o.id}
                style={{
                  backgroundColor: colors.card,
                  borderRadius: 16,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                  opacity: 0.95,
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                  }}
                >
                  <Text style={{ fontWeight: "bold", color: colors.text }}>
                    Pedido #{o.id}
                  </Text>
                  <Text style={{ fontWeight: "bold", color: colors.text }}>
                    ${o.total.toLocaleString("es-CO")}
                  </Text>
                </View>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}
                >
                  {o.customerName ?? "Cliente"} •{" "}
                  {new Date(o.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: "600",
                    color: o.assignedDeliveryPersonName ? "#10B981" : "#EF4444",
                  }}
                >
                  {o.assignedDeliveryPersonName
                    ? `✅ Confirmado — repartidor: ${o.assignedDeliveryPersonName}`
                    : "⚠️ Confirmado sin repartidor asignado"}
                </Text>
              </View>
            ))}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="bicycle-outline" size={56} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>
            No hay pedidos de domicilio esperando confirmación.
          </Text>
        </View>
      }
      renderItem={({ item }) => (
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
          >
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              Pedido #{item.id}
            </Text>
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              ${item.total.toLocaleString("es-CO")}
            </Text>
          </View>

          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
            {item.customerName ?? "Cliente"} •{" "}
            {new Date(item.createdAt).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </Text>

          <Text
            style={{ color: colors.muted, marginTop: 8, fontSize: 13 }}
            numberOfLines={3}
          >
            {item.orderDetails
              .map((d) => `${d.quantity}x ${d.productName}`)
              .join(", ")}
          </Text>

          <TouchableOpacity
            style={{
              backgroundColor: "#10B981",
              borderRadius: 10,
              paddingVertical: 12,
              alignItems: "center",
              marginTop: 14,
              opacity: confirmingId === item.id ? 0.6 : 1,
            }}
            onPress={() => handleConfirm(item)}
            disabled={confirmingId === item.id}
          >
            <Text style={{ color: "#FFF", fontWeight: "bold" }}>
              {confirmingId === item.id ? "Confirmando..." : "Confirmar pedido"}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
  );
}
// Pide al backend que consulte a Wompi el estado real de los pagos pendientes.
// Si alguno quedó aprobado, el backend confirma el pedido y asigna repartidor.
async function syncPendingWompi(order: OrderSummary): Promise<boolean> {
  try {
    const payments = await paymentService.getByOrder(order.id);
    // Solo intentos de los últimos 30 min (los más viejos ya se abandonaron)
    const pending = payments.filter(
      (p) =>
        p.method === PaymentMethod.Wompi &&
        p.status === PaymentStatus.Pending &&
        Date.now() - new Date(p.paidAt).getTime() < 30 * 60 * 1000,
    );
    let approved = false;
    for (const p of pending) {
      const result = await paymentService.syncWompi(p.id);
      if (result.status === PaymentStatus.Completed) approved = true;
    }
    return approved;
  } catch {
    return false;
  }
}
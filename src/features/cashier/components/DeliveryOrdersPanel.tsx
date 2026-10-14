import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { BreakdownRows } from "@/features/orders/components/BreakdownRows";
import { Ionicons } from "@expo/vector-icons";
import { orderService } from "@/features/orders/services/orderService";
import { paymentService } from "@/features/payments/services/paymentService";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/features/payments/types/payment.types";
import {
  OrderDetailStatus,
  OrderStatus,
  OrderType,
  OrderSummary,
} from "@/features/orders/types/order.types";
import { styles } from "../style/CashierStyles";
import { useCashierContext } from "../context/CashierContext";
import { TRANSLATIONS } from "@/locales/CashierTranslations";
import {
  formatColombiaTime,
  isColombiaToday,
} from "@/features/shared/utils/colombia-date";

interface Props {
  branchId: number | null;
  isDark: boolean;
  showToast: (message: string) => void;
  refreshKey?: number;
}
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
  const { language } = useCashierContext();
  const t = TRANSLATIONS[language] || TRANSLATIONS.es;
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [confirmedOrders, setConfirmedOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);
  const [selectedDetailOrder, setSelectedDetailOrder] =
    useState<OrderSummary | null>(null);

  const colors = {
    background: isDark ? "#0B1220" : "#F8FAFC",
    card: isDark ? "#111827" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#CBD5E1" : "#64748B",
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
        // Domicilios de hoy esperando pago: se verifica con Wompi
        const waitingPayment = summaries.filter(
          (o) =>
            o.orderType === OrderType.Delivery &&
            o.status === OrderStatus.Pending &&
            o.orderDetails.length > 0 &&
            isColombiaToday(o.createdAt),
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
            isColombiaToday(o.createdAt),
        );

        // Solo los de efectivo o los que Wompi ya aprobó
        const checks = await Promise.all(candidates.map(isReadyForCashier));
        setOrders(candidates.filter((_, i) => checks[i]));

        // Domicilios ya confirmados hoy (incluye los pagados con Wompi)
        setConfirmedOrders(
          summaries.filter(
            (o) =>
              o.orderType === OrderType.Delivery &&
              (o.status === OrderStatus.Confirmed ||
                o.status === OrderStatus.InPreparation ||
                o.status === OrderStatus.Ready) &&
              isColombiaToday(o.createdAt),
          ),
        );
      } catch (err: any) {
        if (!silent) {
          Alert.alert(
            t.errorTitle,
            err?.message ?? t.deliveryLoadError,
          );
        }
      } finally {
        setLoading(false);
      }
    },
    [branchId, language],
  );

  useEffect(() => {
    fetchPendingDeliveries();
  }, [fetchPendingDeliveries, refreshKey]);

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
        showToast(
          t.deliveryConfirmedToast
            .replace("{id}", String(order.id))
            .replace("{driver}", driver),
        );
      } else {
        Alert.alert(
          t.deliveryNoDriverTitle,
          t.deliveryNoDriverMessage,
        );
      }
      setOrders((prev) => prev.filter((o) => o.id !== order.id));
      setConfirmedOrders((prev) => [
        {
          ...order,
          status: OrderStatus.Confirmed,
          assignedDeliveryPersonName: driver,
        },
        ...prev,
      ]);
    } catch (err: any) {
      Alert.alert(t.errorTitle, err?.message ?? t.deliveryConfirmError);
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
    <>
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
              {t.confirmedToday.replace("{count}", String(confirmedOrders.length))}
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
                    {t.orderNumber.replace("{id}", String(o.id))}
                  </Text>
                  <Text style={{ fontWeight: "bold", color: colors.text }}>
                    ${o.total.toLocaleString("es-CO")}
                  </Text>
                </View>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}
                >
                  {o.customerName ?? t.customer} •{" "}
                  {formatColombiaTime(o.createdAt, undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text
                  style={{
                    marginTop: 8,
                    fontSize: 13,
                    fontWeight: "600",
                    color: o.assignedDeliveryPersonName ? "#10B981" : "#E61C24",
                  }}
                >
                  {o.assignedDeliveryPersonName
                    ? t.deliveryConfirmedWithDriver.replace(
                        "{driver}",
                        o.assignedDeliveryPersonName,
                      )
                    : t.deliveryConfirmedNoDriver}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t.viewOrderDetails}
                  onPress={() => setSelectedDetailOrder(o)}
                  style={{
                    alignSelf: "flex-start",
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    marginTop: 10,
                    paddingHorizontal: 10,
                    paddingVertical: 7,
                    borderRadius: 9,
                    borderWidth: 1,
                    borderColor: colors.border,
                  }}
                >
                  <Ionicons name="eye-outline" size={16} color={colors.muted} />
                  <Text style={{ color: colors.text, fontSize: 12, fontWeight: "700" }}>
                    {t.viewOrderDetails}
                  </Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ) : null
      }
      ListEmptyComponent={
        <View style={{ alignItems: "center", paddingVertical: 40 }}>
          <Ionicons name="bicycle-outline" size={56} color={colors.muted} />
          <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>
            {t.emptyPendingDeliveries}
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
              {t.orderNumber.replace("{id}", String(item.id))}
            </Text>
            <Text style={{ fontWeight: "bold", color: colors.text }}>
              ${item.total.toLocaleString("es-CO")}
            </Text>
          </View>

          <Text style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}>
            {item.customerName ?? t.customer} •{" "}
            {formatColombiaTime(item.createdAt, undefined, {
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

          <View style={{ marginTop: 10 }}>
            <BreakdownRows
              subTotal={item.subTotal}
              tax={item.tax}
              taxRate={item.taxRate}
              taxIncludedInPrice={item.taxIncludedInPrice}
              deliveryFee={item.deliveryFee}
              lang={language}
              textColor={colors.text}
              mutedColor={colors.muted}
            />
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={t.viewOrderDetails}
            onPress={() => setSelectedDetailOrder(item)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              paddingVertical: 9,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: colors.border,
              marginTop: 10,
            }}
          >
            <Ionicons name="eye-outline" size={16} color={colors.muted} />
            <Text style={{ color: colors.text, fontWeight: "700" }}>
              {t.viewOrderDetails}
            </Text>
          </TouchableOpacity>

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
              {confirmingId === item.id ? t.confirmingOrder : t.confirmOrder}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    />
    <Modal
      visible={selectedDetailOrder !== null}
      transparent
      animationType="fade"
      onRequestClose={() => setSelectedDetailOrder(null)}
    >
      {selectedDetailOrder && (
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(0,0,0,0.62)",
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 620,
              maxHeight: "90%",
              borderRadius: 18,
              overflow: "hidden",
              backgroundColor: colors.card,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                padding: 18,
                borderBottomWidth: 1,
                borderBottomColor: colors.border,
              }}
            >
              <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                <Text style={{ color: colors.text, fontSize: 19, fontWeight: "800" }}>
                  {t.paidOrdersDetails}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 3 }}>
                  {t.orderNumber.replace("{id}", String(selectedDetailOrder.id))}
                </Text>
              </View>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t.cancel}
                onPress={() => setSelectedDetailOrder(null)}
                style={{ padding: 7 }}
              >
                <Ionicons name="close" size={24} color={colors.muted} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ padding: 18, gap: 14 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                  {t.tabDelivery}
                </Text>
                <Text style={{ color: colors.muted, fontSize: 13 }}>
                  {selectedDetailOrder.customerName ?? t.customer} · {formatColombiaTime(selectedDetailOrder.createdAt, undefined, {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                {!!selectedDetailOrder.assignedDeliveryPersonName && (
                  <Text style={{ color: "#10B981", fontSize: 13, fontWeight: "700" }}>
                    {t.deliveryConfirmedWithDriver.replace(
                      "{driver}",
                      selectedDetailOrder.assignedDeliveryPersonName,
                    )}
                  </Text>
                )}
              </View>

              <View style={{ height: 1, backgroundColor: colors.border }} />
              <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                {t.paidOrdersProducts}
              </Text>
              {selectedDetailOrder.orderDetails
                .filter(
                  (detail) =>
                    detail.status !== OrderDetailStatus.Voided &&
                    detail.status !== OrderDetailStatus.Cancelled,
                )
                .map((detail) => (
                  <View
                    key={detail.id}
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      gap: 12,
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontSize: 14 }}>
                        {detail.quantity}x {detail.productName}
                      </Text>
                      {!!detail.notes && (
                        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                          {detail.notes}
                        </Text>
                      )}
                    </View>
                    <Text style={{ color: colors.text, fontSize: 14 }}>
                      ${Math.round(
                        Number(
                          detail.subTotal ??
                            Number(detail.unitPrice ?? 0) *
                              Number(detail.quantity ?? 0),
                        ),
                      ).toLocaleString("es-CO")}
                    </Text>
                  </View>
                ))}

              <View style={{ height: 1, backgroundColor: colors.border, marginTop: 2 }} />
              <BreakdownRows
                subTotal={selectedDetailOrder.subTotal}
                tax={selectedDetailOrder.tax}
                taxRate={selectedDetailOrder.taxRate}
                taxIncludedInPrice={selectedDetailOrder.taxIncludedInPrice}
                deliveryFee={selectedDetailOrder.deliveryFee}
                lang={language}
                textColor={colors.text}
                mutedColor={colors.muted}
              />
              <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                  {t.totalToCharge}
                </Text>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
                  ${selectedDetailOrder.total.toLocaleString("es-CO")}
                </Text>
              </View>
            </ScrollView>

            <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
              {selectedDetailOrder.status === OrderStatus.Pending ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={confirmingId === selectedDetailOrder.id}
                  onPress={() => {
                    const orderToConfirm = selectedDetailOrder;
                    setSelectedDetailOrder(null);
                    if (orderToConfirm) void handleConfirm(orderToConfirm);
                  }}
                  style={{
                    minHeight: 46,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: "#10B981",
                    opacity: confirmingId === selectedDetailOrder.id ? 0.65 : 1,
                  }}
                >
                  <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                    {confirmingId === selectedDetailOrder.id ? t.confirmingOrder : t.confirmOrder}
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() => setSelectedDetailOrder(null)}
                  style={{
                    minHeight: 46,
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12,
                    backgroundColor: colors.border,
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: "800" }}>
                    {t.cancel}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}
    </Modal>
    </>
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

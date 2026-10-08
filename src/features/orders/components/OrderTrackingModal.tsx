import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  LeafletMap,
  type MapMarker,
} from "@/features/branches/components/LeafletMap";
import { deliveryService } from "@/features/delivery/services/deliveryService";
import {
  DeliveryStatus,
  type Delivery,
} from "@/features/delivery/types/delivery.types";
import {
  OrderStatus,
  OrderType,
  type OrderSummary,
} from "../types/order.types";

type Props = {
  visible: boolean;
  order: OrderSummary | null;
  refreshKey?: number;
  onClose: () => void;
  onRate: (delivery: Delivery) => void;
};

export function OrderTrackingModal({
  visible,
  order,
  refreshKey = 0,
  onClose,
  onRate,
}: Props) {
  const [delivery, setDelivery] = useState<Delivery | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(
    async (silent = false) => {
      if (!order || order.orderType !== OrderType.Delivery) {
        setDelivery(null);
        return;
      }
      if (!silent) setLoading(true);
      try {
        const list = await deliveryService.getByOrder(order.id);
        setDelivery(list[0] ?? null);
      } catch {
        // si falla, se muestran los datos básicos del pedido
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [order?.id, order?.orderType],
  );

  useEffect(() => {
    if (!visible) return;
    setDelivery(null);
    load();
    const id = setInterval(() => load(true), 15000);
    return () => clearInterval(id);
  }, [visible, load, refreshKey]);

  const cancelled = order?.status === OrderStatus.Cancelled;
  const step: 1 | 2 | 3 =
    order?.status === OrderStatus.Delivered ||
    delivery?.status === DeliveryStatus.Delivered
      ? 3
      : delivery?.status === DeliveryStatus.InTransit
        ? 2
        : 1;

  const destination = useMemo(() => {
    if (delivery?.addressLatitude == null || delivery?.addressLongitude == null)
      return null;
    return {
      latitude: Number(delivery.addressLatitude),
      longitude: Number(delivery.addressLongitude),
    };
  }, [delivery?.addressLatitude, delivery?.addressLongitude]);

  const markers = useMemo<MapMarker[]>(
    () =>
      destination
        ? [
            {
              id: "dest",
              ...destination,
              title: "Tu dirección",
              description: delivery?.addressText ?? undefined,
              color: "#E61C24",
            },
          ]
        : [],
    [destination, delivery?.addressText],
  );

  if (!order) return null;

  const steps = [
    { icon: "restaurant", label: "Preparando" },
    { icon: "bicycle", label: "En camino" },
    { icon: "home", label: "Entregado" },
  ] as const;

  return (
    <Modal animationType="slide" visible={visible} onRequestClose={onClose}>
      <View style={s.container}>
        <View style={s.header}>
          <TouchableOpacity onPress={onClose} style={s.back}>
            <Ionicons name="chevron-down" size={26} color="#1E293B" />
          </TouchableOpacity>
          <Text style={s.title}>Pedido #{order.id}</Text>
        </View>

        {cancelled ? (
          <View style={s.cancelBanner}>
            <Ionicons name="close-circle" size={20} color="#B91C1C" />
            <Text style={s.cancelText}>Este pedido fue cancelado.</Text>
          </View>
        ) : (
          <View style={s.stepsRow}>
            {steps.map((st, i) => {
              const active = step >= i + 1;
              return (
                <React.Fragment key={st.label}>
                  {i > 0 && <View style={[s.line, active && s.lineActive]} />}
                  <View style={{ alignItems: "center" }}>
                    <View style={[s.dot, active && s.dotActive]}>
                      <Ionicons
                        name={st.icon}
                        size={16}
                        color={active ? "#FFF" : "#94A3B8"}
                      />
                    </View>
                    <Text style={[s.stepLabel, active && { color: "#10B981" }]}>
                      {st.label}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </View>
        )}

        {loading && (
          <ActivityIndicator style={{ marginTop: 16 }} color="#E61C24" />
        )}

        {destination && (
          <View style={s.mapBox}>
            <LeafletMap markers={markers} fitKey={`track-${order.id}`} />
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {delivery?.addressText ? (
            <Text style={s.address}>📍 {delivery.addressText}</Text>
          ) : null}

          {delivery?.deliveryPersonName ? (
            <View style={s.driverRow}>
              <Text style={{ fontSize: 26 }}>🛵</Text>
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.driverName}>{delivery.deliveryPersonName}</Text>
                <Text style={s.driverPhone}>
                  {delivery.deliveryPersonPhone ?? "Sin teléfono"}
                </Text>
              </View>
              {delivery.deliveryPersonPhone && step < 3 && !cancelled && (
                <TouchableOpacity
                  style={s.call}
                  onPress={() =>
                    Linking.openURL(`tel:${delivery.deliveryPersonPhone}`)
                  }
                >
                  <Ionicons name="call" size={20} color="#FFF" />
                </TouchableOpacity>
              )}
            </View>
          ) : null}

          <Text style={s.sectionTitle}>Productos</Text>
          {order.orderDetails.map((d) => (
            <View key={d.id} style={s.itemRow}>
              <Text style={s.itemName}>
                {d.quantity}x {d.productName}
              </Text>
              <Text style={s.itemPrice}>
                ${(d.unitPrice * d.quantity).toLocaleString("es-CO")}
              </Text>
            </View>
          ))}
          <Text style={s.total}>
            Total: ${order.total.toLocaleString("es-CO")}
          </Text>

          {step === 3 &&
            delivery &&
            !cancelled &&
            (delivery.customerRating != null ? (
              <View style={s.ratedBox}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={s.ratedText}>
                  Calificaste al repartidor con {delivery.customerRating}/5
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                style={s.rateBtn}
                onPress={() => onRate(delivery)}
              >
                <Ionicons name="star-outline" size={18} color="#FFF" />
                <Text style={s.rateBtnText}>Calificar al repartidor</Text>
              </TouchableOpacity>
            ))}
        </ScrollView>
      </View>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAFC" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    paddingTop: 40,
    backgroundColor: "#FFF",
    borderBottomWidth: 1,
    borderColor: "#E2E8F0",
  },
  back: { marginRight: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#1E293B" },
  stepsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    padding: 18,
    backgroundColor: "#FFF",
  },
  dot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  dotActive: { backgroundColor: "#10B981" },
  line: { width: 50, height: 4, backgroundColor: "#F1F5F9", marginTop: 16 },
  lineActive: { backgroundColor: "#10B981" },
  stepLabel: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: "700",
    color: "#94A3B8",
  },
  cancelBanner: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    padding: 14,
    backgroundColor: "#FEE2E2",
  },
  cancelText: { color: "#B91C1C", fontWeight: "700" },
  mapBox: { height: 240 },
  address: { color: "#334155", fontWeight: "600", marginBottom: 14 },
  driverRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFF",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    marginBottom: 16,
  },
  driverName: { fontSize: 15, fontWeight: "bold", color: "#1E293B" },
  driverPhone: { color: "#3B82F6", marginTop: 2 },
  call: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#E61C24",
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#64748B",
    marginBottom: 6,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  itemName: { color: "#1E293B", fontWeight: "600", flex: 1 },
  itemPrice: { color: "#64748B" },
  total: {
    textAlign: "right",
    fontWeight: "bold",
    fontSize: 16,
    color: "#1E293B",
    marginTop: 10,
  },
  rateBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F59E0B",
    padding: 14,
    borderRadius: 12,
    marginTop: 20,
  },
  rateBtnText: { color: "#FFF", fontWeight: "700" },
  ratedBox: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  ratedText: { color: "#64748B", fontWeight: "600" },
});

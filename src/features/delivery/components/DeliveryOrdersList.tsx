import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Linking,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { deliveryService } from "../services/deliveryService";
import { Delivery, DeliveryStatus } from "../types/delivery.types";
import { DeliveryModals } from "./DeliveryModals";
import { useDeliveryContext } from "./context/DeliveryContext";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";
import { styles } from "./style/DeliveryOrdersListStyles";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useNotificationListener } from "@/features/notifications/context/UserNotificationsContext";


export const DeliveryOrdersList = () => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];
  const { profile } = useMyProfile();

  const colors = isDark
    ? {
        background: "#0F172A",
        card: "#1E293B",
        text: "#F8FAFC",
        muted: "#94A3B8",
        border: "#334155",
        accent: "#E61C24",
        btnPrimary: "#E61C24",
        badgeSuccessBg: "#064E3B",
        badgeSuccessText: "#34D399",
        badgeWarningBg: "#78350F",
        badgeWarningText: "#FBBF24",
        badgeInfoBg: "#1E3A8A",
        badgeInfoText: "#93C5FD",
        badgeDangerBg: "#7F1D1D",
        badgeDangerText: "#FCA5A5",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: "#1E293B",
        muted: "#64748B",
        border: "#E2E8F0",
        accent: "#E61C24",
        btnPrimary: "#1A1A1A",
        badgeSuccessBg: "#ECFDF5",
        badgeSuccessText: "#10B981",
        badgeWarningBg: "#FEF3C7",
        badgeWarningText: "#D97706",
        badgeInfoBg: "#DBEAFE",
        badgeInfoText: "#2563EB",
        badgeDangerBg: "#FEE2E2",
        badgeDangerText: "#DC2626",
      };

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(
    async (silent = false) => {
      if (!profile?.id) return;
      if (!silent) setLoading(true);
      try {
        const data = await deliveryService.getByEmployee(profile.id);
        // Solo lo activo — lo ya entregado no se muestra aquí
        setDeliveries(
          data.filter(
            (d) =>
              d.status !== DeliveryStatus.Delivered &&
              d.orderStatus !== "Cancelled",
          ),
        );
      } catch (err: any) {
        if (!silent)
          Alert.alert(
            "Error",
            err?.message ?? "No se pudieron cargar tus entregas.",
          );
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [profile?.id],
  );
  // Al llegar un domicilio asignado (o cambiar/cancelarse un pedido) se recarga la lista al instante
  useNotificationListener((n) => {
    if (
      [
        "DeliveryAssigned",
        "OrderStatusChanged",
        "OrderReady",
        "Resync",
      ].includes(n.type)
    ) {
      fetchDeliveries(true);
    }
  });
  // Refresca al enfocar la pantalla y cada 20 s en segundo plano
  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
      const id = setInterval(() => fetchDeliveries(true), 20000);
      return () => clearInterval(id);
    }, [fetchDeliveries]),
  );

  // Mantiene el modal abierto sincronizado con el último refresco de la lista
  useEffect(() => {
    setSelectedDelivery((prev) =>
      prev ? (deliveries.find((d) => d.id === prev.id) ?? prev) : prev,
    );
  }, [deliveries]);

  const handleOpenDelivery = (delivery: Delivery) => {
    setSelectedDelivery(delivery);
    setIsSheetExpanded(true);
    setMapModalVisible(true);
  };

  const handleStartTrip = async (delivery: Delivery) => {
    setStartError(null);
    try {
      await deliveryService.updateStatus(delivery.id, DeliveryStatus.InTransit);

      // Recargamos completo: la respuesta del PATCH puede venir sin kitchenReady, items, etc.
      const fresh = await deliveryService.getByEmployee(profile!.id);
      const active = fresh.filter(
        (d) =>
          d.status !== DeliveryStatus.Delivered &&
          d.orderStatus !== "Cancelled",
      );
      setDeliveries(active);
      handleOpenDelivery(
        active.find((d) => d.id === delivery.id) ?? {
          ...delivery,
          status: DeliveryStatus.InTransit,
        },
      );
    } catch (err: any) {
      setStartError(err?.message ?? "No se pudo iniciar la entrega.");
    }
  };

  const handleFinishDelivery = async () => {
    if (!selectedDelivery) return;
    const deliveredId = selectedDelivery.id;
    try {
      await deliveryService.updateStatus(deliveredId, DeliveryStatus.Delivered);

      // 1) Primero se cierra el modal del mapa (sin tocar lista ni selección)
      setMapModalVisible(false);

      // 2) Cuando ya terminó de cerrarse, se limpia el resto y se avisa
      setTimeout(() => {
        setDeliveries((prev) => prev.filter((d) => d.id !== deliveredId));
        setSelectedDelivery(null);
        Alert.alert(
          t.successDeliveryTitle || "¡Entrega Exitosa!",
          t.successDeliveryMsg || "Has completado este pedido.",
        );
      }, 400);
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "No se pudo marcar como entregado.");
    }
  };

  const handleCallCustomer = (phone: string | null) => {
    if (!phone) return;
    Linking.openURL(`tel:${phone}`);
  };

  const toggleSheet = () => setIsSheetExpanded((prev) => !prev);

  const renderDeliveryItem = ({ item }: { item: Delivery }) => {
    const isInTransit = item.status === DeliveryStatus.InTransit;
    const mustCollect = (item.amountPending ?? 0) > 0;
    // Mientras cocina no termine, el repartidor no puede salir.
    const waitingKitchen = !isInTransit && !item.kitchenReady;

    return (
      <View
        style={[
          styles.orderCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <View style={styles.orderHeader}>
          <Text style={[styles.orderId, { color: colors.text }]}>
            Pedido #{item.orderId}
          </Text>
          <View
            style={[
              styles.orderStatus,
              {
                backgroundColor: isInTransit
                  ? colors.badgeInfoBg
                  : waitingKitchen
                    ? colors.badgeWarningBg
                    : colors.badgeSuccessBg,
              },
            ]}
          >
            <Text
              style={{
                fontSize: 12,
                fontWeight: "bold",
                color: isInTransit
                  ? colors.badgeInfoText
                  : waitingKitchen
                    ? colors.badgeWarningText
                    : colors.badgeSuccessText,
              }}
            >
              {isInTransit
                ? "En camino"
                : waitingKitchen
                  ? "En cocina"
                  : "Listo para recoger"}
            </Text>
          </View>
        </View>

        <Text style={[styles.customerName, { color: colors.text }]}>
          🧑 {item.customerName ?? "Cliente"}
        </Text>
        <Text style={[styles.addressText, { color: colors.muted }]}>
          📍 {item.addressText ?? "Sin dirección"}
        </Text>
        <Text style={[styles.itemsSummaryText, { color: colors.accent }]}>
          🍔 {item.itemsCount} artículos
        </Text>
        {(item.items ?? []).slice(0, 3).map((it, i) => (
          <Text key={i} style={{ color: colors.muted, fontSize: 13 }}>
            • {it.quantity}x {it.productName}
          </Text>
        ))}
        {(item.items?.length ?? 0) > 3 && (
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            +{item.items.length - 3} más…
          </Text>
        )}

        <View style={styles.paymentSummaryRow}>
          <View
            style={[
              styles.paymentBadge,
              {
                backgroundColor: mustCollect
                  ? colors.badgeWarningBg
                  : colors.badgeSuccessBg,
              },
            ]}
          >
            <Text
              style={[
                styles.paymentBadgeText,
                {
                  color: mustCollect
                    ? colors.badgeWarningText
                    : colors.badgeSuccessText,
                },
              ]}
            >
              {mustCollect
                ? `Cobrar $${Math.round(item.amountPending).toLocaleString("es-CO")}`
                : (item.paymentMethod ?? "Pagado")}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.acceptButton,
            {
              backgroundColor: isInTransit
                ? "#3B82F6"
                : waitingKitchen
                  ? "#94A3B8"
                  : colors.btnPrimary,
            },
          ]}
          disabled={waitingKitchen}
          onPress={() =>
            isInTransit ? handleOpenDelivery(item) : handleStartTrip(item)
          }
        >
          <Text style={[styles.acceptButtonText, { color: "#FFFFFF" }]}>
            {isInTransit
              ? "Ver ruta"
              : waitingKitchen
                ? "Esperando a cocina"
                : "Iniciar entrega"}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading)
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 12,
        }}
      >
        <NotificationBell />
      </View>
      {startError && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: "#FEF3C7",
            padding: 12,
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 10,
          }}
        >
          <Ionicons name="alert-circle-outline" size={18} color="#92400E" />
          <Text style={{ flex: 1, color: "#92400E", fontWeight: "600" }}>
            {startError}
          </Text>
          <TouchableOpacity onPress={() => setStartError(null)}>
            <Ionicons name="close" size={18} color="#92400E" />
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        data={deliveries}
        renderItem={renderDeliveryItem}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContainer}
        onRefresh={() => fetchDeliveries()}
        refreshing={loading}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="bicycle-outline" size={60} color={colors.muted} />
            <Text style={[styles.emptyText, { color: colors.muted }]}>
              No tienes pedidos asignados por ahora.
            </Text>
          </View>
        }
      />

      <DeliveryModals
        mapModalVisible={mapModalVisible}
        setMapModalVisible={setMapModalVisible}
        selectedDelivery={selectedDelivery}
        setSelectedDelivery={setSelectedDelivery}
        isSheetExpanded={isSheetExpanded}
        toggleSheet={toggleSheet}
        handleCallCustomer={handleCallCustomer}
        handleFinishDelivery={handleFinishDelivery}
        styles={styles}
      />
    </View>
  );
};;

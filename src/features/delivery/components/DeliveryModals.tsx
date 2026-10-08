import { Ionicons } from "@expo/vector-icons";
import React, { useEffect, useMemo, useState } from "react";
import {
  Linking,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Delivery, DeliveryStatus } from "../types/delivery.types";
import ConfirmDeliveryModal from "./ConfirmDeliveryModal";
import {
  LeafletMap,
  type MapMarker,
} from "@/features/branches/components/LeafletMap";
import { useDeliveryRoute } from "@/features/branches/hooks/useDeliveryRoute";
import { useDriverLocation } from "../hooks/useDriverLocation";

import { useDeliveryContext } from "./context/DeliveryContext";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";

interface DeliveryModalsProps {
  mapModalVisible: boolean;
  setMapModalVisible: (visible: boolean) => void;
  selectedDelivery: Delivery | null;
  setSelectedDelivery: (delivery: Delivery | null) => void;
  isSheetExpanded: boolean;
  toggleSheet: () => void;
  handleCallCustomer: (phone: string | null) => void;
  handleFinishDelivery: () => Promise<void>;
  styles: any;
}

export const DeliveryModals = ({
  mapModalVisible,
  setMapModalVisible,
  selectedDelivery,
  setSelectedDelivery,
  isSheetExpanded,
  toggleSheet,
  handleCallCustomer,
  handleFinishDelivery,
  styles,
}: DeliveryModalsProps) => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];
  // El cobro en efectivo se registra en el back al marcar "Entregado".
  // Aquí solo se confirma que el repartidor ya recibió el dinero.
const [confirmVisible, setConfirmVisible] = useState(false);
const [finishing, setFinishing] = useState(false);

useEffect(() => {
  setConfirmVisible(false);
}, [selectedDelivery?.id]);

const onConfirmDelivery = async () => {
  setFinishing(true);
  // Primero se cierra el modal de confirmación...
  setConfirmVisible(false);
  try {
    // ...y recién después se finaliza la entrega
    await new Promise((r) => setTimeout(r, 250));
    await handleFinishDelivery();
  } finally {
    setFinishing(false);
  }
};

  // Solo se puede cobrar/entregar si ya salió y cocina terminó
  const canAct =
    selectedDelivery?.status === DeliveryStatus.InTransit &&
    Boolean(selectedDelivery?.kitchenReady);

  const destination = useMemo(() => {
    const lat = selectedDelivery?.addressLatitude;
    const lng = selectedDelivery?.addressLongitude;
    if (lat == null || lng == null) return null;
    return { latitude: Number(lat), longitude: Number(lng) };
  }, [selectedDelivery?.addressLatitude, selectedDelivery?.addressLongitude]);

  const { location: driverLocation } = useDriverLocation(mapModalVisible);
  const { route, distanceKm, durationMin } = useDeliveryRoute(
    driverLocation,
    destination,
  );

  const markers = useMemo<MapMarker[]>(() => {
    const list: MapMarker[] = [];
    if (destination)
      list.push({
        id: "dest",
        ...destination,
        title: selectedDelivery?.customerName ?? "Cliente",
        description: selectedDelivery?.addressText ?? undefined,
        color: "#E61C24",
      });
    if (driverLocation)
      list.push({ id: "me", ...driverLocation, title: "Tú", color: "#2563EB" });
    return list;
  }, [
    destination,
    driverLocation,
    selectedDelivery?.customerName,
    selectedDelivery?.addressText,
  ]);

  const colors = isDark
    ? {
        background: "#0F172A",
        card: "#1E293B",
        text: "#F8FAFC",
        muted: "#94A3B8",
        border: "#334155",
        accent: "#E61C24",
        boxBg: "#0F172A",
        successBg: "#064E3B",
        successText: "#34D399",
        dangerBg: "#7F1D1D",
        dangerText: "#FCA5A5",
      }
    : {
        background: "#F8FAFC",
        card: "#FFFFFF",
        text: "#1E293B",
        muted: "#64748B",
        border: "#E2E8F0",
        accent: "#E61C24",
        boxBg: "#F8FAFC",
        successBg: "#ECFDF5",
        successText: "#10B981",
        dangerBg: "#FEF2F2",
        dangerText: "#DC2626",
      };

  const isCashPending = Boolean(
    selectedDelivery && (selectedDelivery.amountPending ?? 0) > 0,
  );

  const money = (n: number) =>
    "$" + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");



  return (
    <>
    <Modal
      animationType="slide"
      transparent={false}
      visible={mapModalVisible}
      onRequestClose={() => setMapModalVisible(false)}
    >
      <View
        style={[styles.mapContainer, { backgroundColor: colors.background }]}
      >
        <View style={styles.mapHeader}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: colors.card }]}
            onPress={() => setMapModalVisible(false)}
          >
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
          <Text
            style={[
              styles.mapHeaderTitle,
              { color: colors.text, textShadowColor: isDark ? "#000" : "#FFF" },
            ]}
          >
            {t.onWayToCustomer || "En camino al cliente"}
            {durationMin != null && distanceKm != null
              ? ` · ${durationMin} min · ${distanceKm.toFixed(1)} km`
              : ""}
          </Text>
        </View>

        <View style={styles.fakeMapImage}>
          {destination ? (
            <LeafletMap
              markers={markers}
              route={route}
              fitKey={`${selectedDelivery?.id}-${driverLocation ? "gps" : "nogps"}`}
            />
          ) : (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text style={{ color: colors.muted }}>
                Este pedido no tiene ubicación en el mapa
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.bottomSheet, { backgroundColor: colors.card }]}>
          <TouchableOpacity
            style={styles.dragHandleArea}
            onPress={toggleSheet}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.bottomSheetHandle,
                { backgroundColor: colors.border },
              ]}
            />
            <Ionicons
              name={isSheetExpanded ? "chevron-down" : "chevron-up"}
              size={20}
              color={colors.muted}
            />
            <Text style={[styles.dragText, { color: colors.muted }]}>
              {isSheetExpanded
                ? t.hideDetails || "Ocultar detalles"
                : t.viewOrderDetails || "Ver detalles del pedido"}
            </Text>
          </TouchableOpacity>

          {selectedDelivery && (
            <ScrollView showsVerticalScrollIndicator={false} bounces={false}>
              <Text style={[styles.deliverToText, { color: colors.muted }]}>
                {t.deliverTo || "Entregar a:"}
              </Text>

              <View style={styles.customerInfoRow}>
                <View style={styles.customerTextContainer}>
                  <Text
                    style={[styles.customerNameLarge, { color: colors.text }]}
                  >
                    {selectedDelivery.customerName ?? "Cliente"}
                  </Text>
                  <Text
                    style={[
                      styles.customerAddressLarge,
                      { color: colors.muted },
                    ]}
                    numberOfLines={isSheetExpanded ? undefined : 1}
                  >
                    {selectedDelivery.addressText ?? "Sin dirección"}
                  </Text>
                  {!!selectedDelivery.addressReference && (
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      Ref: {selectedDelivery.addressReference}
                    </Text>
                  )}
                </View>
                <TouchableOpacity
                  style={styles.callCircleButton}
                  onPress={() =>
                    handleCallCustomer(selectedDelivery.customerPhone)
                  }
                >
                  <Ionicons name="call" size={22} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {isSheetExpanded && (
                <View style={styles.expandedContent}>
                  {selectedDelivery.customerPhone && (
                    <View
                      style={[
                        styles.phoneBox,
                        {
                          backgroundColor: colors.boxBg,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.phoneText, { color: colors.text }]}>
                        {t.tel || "Tel:"} {selectedDelivery.customerPhone}
                      </Text>
                    </View>
                  )}

                  <View
                    style={[
                      styles.paymentStateBox,
                      isCashPending
                        ? { backgroundColor: colors.dangerBg }
                        : { backgroundColor: colors.successBg },
                    ]}
                  >
                    <Text
                      style={[
                        styles.paymentStateLabel,
                        {
                          color: isCashPending
                            ? colors.dangerText
                            : colors.successText,
                        },
                      ]}
                    >
                      {t.paymentStatus || "Pago:"}
                    </Text>
                    <Text
                      style={[
                        styles.paymentStateValue,
                        {
                          color: isCashPending
                            ? colors.dangerText
                            : colors.successText,
                        },
                      ]}
                    >
                      {selectedDelivery.paymentMethod ?? "Pendiente"} ·{" "}
                      {selectedDelivery.paymentStatus ?? "Sin registrar"}
                    </Text>
                  </View>

                  <View style={styles.mapProductsBox}>
                    <Text
                      style={[styles.mapProductsTitle, { color: colors.muted }]}
                    >
                      {selectedDelivery.itemsCount} artículos en este pedido
                    </Text>

                    {(selectedDelivery.items ?? []).map((it, idx) => (
                      <View
                        key={idx}
                        style={{
                          flexDirection: "row",
                          justifyContent: "space-between",
                          paddingVertical: 6,
                          borderBottomWidth: 1,
                          borderBottomColor: colors.border,
                        }}
                      >
                        <View style={{ flex: 1, paddingRight: 8 }}>
                          <Text
                            style={{ color: colors.text, fontWeight: "600" }}
                          >
                            {it.quantity}x {it.productName}
                          </Text>
                          {!!it.notes && (
                            <Text style={{ color: colors.muted, fontSize: 12 }}>
                              📝 {it.notes}
                            </Text>
                          )}
                        </View>
                        <Text style={{ color: colors.muted }}>
                          {money(it.unitPrice * it.quantity)}
                        </Text>
                      </View>
                    ))}

                    {!!selectedDelivery.orderNotes && (
                      <Text
                        style={{
                          color: colors.accent,
                          marginTop: 8,
                          fontWeight: "600",
                        }}
                      >
                        Nota del cliente: {selectedDelivery.orderNotes}
                      </Text>
                    )}

                    <Text
                      style={{
                        color: colors.text,
                        fontWeight: "bold",
                        fontSize: 16,
                        marginTop: 8,
                        textAlign: "right",
                      }}
                    >
                      Total: {money(selectedDelivery.total ?? 0)}
                    </Text>
                  </View>

                  {!selectedDelivery.kitchenReady && (
                    <Text
                      style={{
                        color: colors.dangerText,
                        fontWeight: "600",
                        marginBottom: 8,
                      }}
                    >
                      La cocina aún no termina este pedido. No puedes cobrar ni
                      entregar todavía.
                    </Text>
                  )}

                  {destination && (
                    <TouchableOpacity
                      style={{
                        padding: 12,
                        borderRadius: 10,
                        alignItems: "center",
                        backgroundColor: "#3B82F6",
                        marginBottom: 8,
                      }}
                      onPress={() =>
                        Linking.openURL(
                          `https://www.google.com/maps/dir/?api=1&destination=${destination.latitude},${destination.longitude}&travelmode=driving`,
                        )
                      }
                    >
                      <Text style={{ color: "#FFF", fontWeight: "700" }}>
                        Abrir en Google Maps
                      </Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.finishDeliveryButton,
                      !canAct && { opacity: 0.5 },
                    ]}
                    onPress={() => setConfirmVisible(true)}
                    disabled={!canAct}
                  >
                    <Text style={styles.finishDeliveryText}>
                      {isCashPending
                        ? `${t.btnMarkDelivered || "Marcar como Entregado"} · ${money(selectedDelivery.amountPending)}`
                        : t.btnMarkDelivered || "Marcar como Entregado"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>
          )}
        </View>

      </View>
    </Modal>

    <ConfirmDeliveryModal
      visible={confirmVisible}
      loading={finishing}
      isCash={isCashPending}
      amount={selectedDelivery ? money(selectedDelivery.amountPending ?? 0) : undefined}
      isDark={isDark}
      onCancel={() => setConfirmVisible(false)}
      onConfirm={onConfirmDelivery}
    />
    </>
  );
};

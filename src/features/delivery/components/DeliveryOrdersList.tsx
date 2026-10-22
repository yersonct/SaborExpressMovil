import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  AppState,
  Alert,
  FlatList,
  Linking,
  Platform,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Location from "expo-location";
import { deliveryService } from "../services/deliveryService";
import { Delivery, DeliveryStatus } from "../types/delivery.types";
import { DeliveryModals } from "./DeliveryModals";
import { useDeliveryContext } from "./context/DeliveryContext";
import { getDeliveryTheme } from "./context/deliveryTheme";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import {
  TRANSLATIONS,
  LanguageCode,
} from "../../../locales/DeliveryTranslations";
import { styles } from "./style/DeliveryOrdersListStyles";
import { translateMobileCopy } from "../../../locales/mobileCopy";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import {
  useUserNotifications,
} from "@/features/notifications/context/UserNotificationsContext";
import { employeeService } from "@/features/employees/services/employeeService";
import { subscribeToNetworkRecovery } from "@/features/shared/services/networkStatus";
import { loadSession } from "@/features/auth/services/tokenStorage";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { deferEffect } from "@/features/shared/utils/deferEffect";


export const DeliveryOrdersList = () => {
  const { language, isDark } = useDeliveryContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];
  const { profile, refetch: refetchProfile } = useMyProfile();
  const { reportDeliveryLocation } = useUserNotifications();

  const colors = getDeliveryTheme(isDark);

  const [deliveries, setDeliveries] = useState<Delivery[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDelivery, setSelectedDelivery] = useState<Delivery | null>(
    null,
  );
  const [mapModalVisible, setMapModalVisible] = useState(false);
  const [isSheetExpanded, setIsSheetExpanded] = useState(true);
  const [startError, setStartError] = useState<string | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const hasInTransitDelivery = deliveries.some(
    (delivery) => delivery.status === DeliveryStatus.InTransit,
  );
  const lastLocationReportAtRef = useRef(0);
  const locationPermissionRequestedRef = useRef(false);
  const locationReportInFlightRef = useRef<Promise<void> | null>(null);

  const reportDriverLocation = useCallback(
    async (force = false) => {
      if (
        !profile?.id ||
        (!profile.isAvailable && !hasInTransitDelivery && !force) ||
        Date.now() - lastLocationReportAtRef.current <
          (hasInTransitDelivery ? 10_000 : 60_000)
      ) {
        return;
      }

      if (locationReportInFlightRef.current) {
        await locationReportInFlightRef.current;
        return;
      }

      const request = (async () => {
        try {
          let latitude: number;
          let longitude: number;
          if (Platform.OS === "web") {
            // El navegador requiere HTTPS o localhost y permiso expreso del usuario.
            const coords = await new Promise<{ latitude: number; longitude: number }>((resolve, reject) => {
              if (typeof navigator === "undefined" || !navigator.geolocation) {
                reject(new Error("Geolocalización web no disponible: usa HTTPS/localhost y habilita GPS."));
                return;
              }
              navigator.geolocation.getCurrentPosition(
                (pos) => resolve({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
                (error) => reject(error),
                { enableHighAccuracy: true, maximumAge: 5000, timeout: 12000 },
              );
            });
            latitude = coords.latitude;
            longitude = coords.longitude;
          } else {
            let permission = await Location.getForegroundPermissionsAsync();
            if (!permission.granted && permission.canAskAgain && (force || !locationPermissionRequestedRef.current)) {
              locationPermissionRequestedRef.current = true;
              permission = await Location.requestForegroundPermissionsAsync();
            }
            if (!permission.granted) {
              setGpsError(t.gpsPermissionRequired);
              return;
            }
            const position = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
            latitude = position.coords.latitude;
            longitude = position.coords.longitude;
          }
          const sentOverSocket = await reportDeliveryLocation(latitude, longitude);
          if (!sentOverSocket) {
            // Conserva el reporte si SignalR aún está conectando o reconectando.
            await employeeService.updateMyLocation(latitude, longitude);
          }
          lastLocationReportAtRef.current = Date.now();
          setGpsError(null);
        } catch (error) {
          // Ubicación no disponible: dejar una explicación visible, nunca inventar coordenadas.
          if (__DEV__) console.warn("[Repartidor] No se pudo compartir GPS:", error);
          setGpsError(t.gpsPermissionRequired);
        }
      })();

      locationReportInFlightRef.current = request;
      try {
        await request;
      } finally {
        if (locationReportInFlightRef.current === request) {
          locationReportInFlightRef.current = null;
        }
      }
    },
    [
      profile,
      hasInTransitDelivery,
      reportDeliveryLocation,
      t.gpsPermissionRequired,
    ],
  );

  const fetchDeliveries = useCallback(
    async (silent = false) => {
      if (!profile?.id) return;
      if (!silent) setLoading(true);
      try {
        // GPS y pedidos se cargan en paralelo. Esperar una lectura GPS puede
        // dejar la lista vacía varios segundos, aunque la entrega ya esté asignada.
        void reportDriverLocation().catch(() => undefined);
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
        if (!silent) {
          // apiClient cierra la sesión cuando confirma que el token fue
          // revocado. No pongas encima del login un alert de una petición
          // antigua de esta pantalla.
          if (
            (err?.statusCode === 401 || err?.statusCode === 403) &&
            !(await loadSession())
          ) {
            return;
          }
          Alert.alert(
            t.errorTitle ?? "Error",
            err?.message ?? t.deliveryLoadError ?? "No se pudieron cargar tus entregas.",
          );
        }
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [profile, reportDriverLocation, t.deliveryLoadError, t.errorTitle],
  );

  useEffect(() => {
    if (
      !profile?.id ||
      (!profile.isAvailable && !hasInTransitDelivery) ||
      Platform.OS === "web"
    ) return;
    let cancelled = false;
    let subscription: Location.LocationSubscription | null = null;

    void (async () => {
      await reportDriverLocation();
      if (cancelled) return;

      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.Balanced,
          distanceInterval: hasInTransitDelivery ? 15 : 75,
          timeInterval: hasInTransitDelivery ? 10_000 : 60_000,
        },
        () => void reportDriverLocation(),
      );
      if (cancelled) subscription.remove();
    })().catch(() => undefined);

    return () => {
      cancelled = true;
      subscription?.remove();
    };
  }, [
    profile?.id,
    profile?.isAvailable,
    hasInTransitDelivery,
    reportDriverLocation,
  ]);
  // Seguimiento del navegador mientras la página del repartidor esté abierta.
  // No promete GPS de fondo: los navegadores suspenden procesos en pestañas cerradas.
  useEffect(() => {
    if (Platform.OS !== "web" || !profile?.id || (!profile.isAvailable && !hasInTransitDelivery)) return;
    void reportDriverLocation();
    const interval = setInterval(() => void reportDriverLocation(), hasInTransitDelivery ? 15_000 : 60_000);
    return () => clearInterval(interval);
  }, [profile?.id, profile?.isAvailable, hasInTransitDelivery, reportDriverLocation]);

  useRealtimeEvents(
    ["DeliveriesChanged", "OrdersChanged", "RealtimeConnected"],
    () => void fetchDeliveries(true),
  );

  // Carga al entrar y al volver a esta pantalla.
  useFocusEffect(
    useCallback(() => {
      fetchDeliveries();
    }, [fetchDeliveries]),
  );

  // Si el backend vuelve a responder después de un corte, consulta de inmediato
  // los domicilios que pudieron asignarse mientras el repartidor estaba desconectado.
  useEffect(
    () =>
      subscribeToNetworkRecovery(() => {
        void fetchDeliveries(true);
        void refetchProfile();
      }),
    [fetchDeliveries, refetchProfile],
  );

  // En móviles, los temporizadores y SignalR pueden quedar suspendidos en segundo
  // plano. Al volver a la app se consultan de nuevo pedidos y disponibilidad.
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state !== "active") return;
      // No retener la lista mientras el backend reactiva presencia y reintenta
      // asignaciones pendientes. Los eventos de entregas refrescan lo nuevo.
      void fetchDeliveries(true);
      void employeeService.setAvailability(true).catch(() => undefined);
      void refetchProfile();
    });
    return () => subscription.remove();
  }, [fetchDeliveries, refetchProfile]);

  // Presencia automática: el repartidor no necesita un botón de activación.
  // Un latido sin GPS cada minuto permite asignar incluso si denegó ubicación.
  // Al cerrar/suspender la app, el backend deja de considerarlo online tras 3 min.
  useFocusEffect(
    useCallback(() => {
      if (!profile?.id) return;
      let mounted = true;
      let busy = false;
      const keepAlive = async () => {
        if (busy || AppState.currentState !== "active") return;
        busy = true;
        try {
          await employeeService.setAvailability(true);
          if (mounted && !profile.isAvailable) await refetchProfile();
        } catch {
          // No falsear el estado: el próximo latido reintentará al recuperar red.
        } finally {
          busy = false;
        }
      };
      void keepAlive();
      const heartbeat = setInterval(() => void keepAlive(), 60_000);
      return () => {
        mounted = false;
        clearInterval(heartbeat);
      };
    }, [profile, refetchProfile]),
  );

  // Mantiene el modal abierto sincronizado con el último refresco de la lista
  useEffect(() => deferEffect(() => {
    setSelectedDelivery((prev) =>
      prev ? (deliveries.find((d) => d.id === prev.id) ?? prev) : prev,
    );
  }), [deliveries]);

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
      Alert.alert(t.errorTitle, err?.message ?? t.deliveryMarkError);
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
            {translateMobileCopy("Pedido #{{id}}", { id: item.orderId })}
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
                ? t.onWayLabel
                : waitingKitchen
                  ? t.inKitchenLabel
                  : t.readyForPickupLabel}
            </Text>
          </View>
        </View>

        <Text style={[styles.customerName, { color: colors.text }]}>
          🧑 {item.customerName ?? t.customerLabel}
        </Text>
        <Text style={[styles.addressText, { color: colors.muted }]}>
          📍 {item.addressText ?? t.noAddressLabel}
        </Text>
        <Text style={[styles.itemsSummaryText, { color: colors.accent }]}>
          🍔 {t.deliveryItemsCount(item.itemsCount)}
        </Text>
        {(item.items ?? []).slice(0, 3).map((it, i) => (
          <Text key={i} style={{ color: colors.muted, fontSize: 13 }}>
            • {it.quantity}x {it.productName}
          </Text>
        ))}
        {(item.items?.length ?? 0) > 3 && (
          <Text style={{ color: colors.muted, fontSize: 13 }}>
            +{item.items.length - 3} {t.moreItems}
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
                ? translateMobileCopy("Cobrar ${{amount}}", {
                    amount: Math.round(item.amountPending).toLocaleString(language === "fr" ? "fr-FR" : language === "pt" ? "pt-BR" : language === "en" ? "en-US" : "es-CO"),
                  })
                : translateMobileCopy(item.paymentMethod ?? "Pagado")}
            </Text>
          </View>
        </View>

        {waitingKitchen ? (
          <View style={{ flexDirection: "row", gap: 10 }}>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                {
                  flex: 1,
                  backgroundColor: colors.badgeWarningBg,
                  borderWidth: 1,
                  borderColor: isDark ? colors.badgeWarningText : "#D97706",
                },
              ]}
              disabled
              accessibilityRole="button"
              accessibilityState={{ disabled: true }}
            >
              <Text
                style={[
                  styles.acceptButtonText,
                  {
                    color: isDark ? colors.badgeWarningText : "#92400E",
                    textAlign: "center",
                  },
                ]}
              >
                {t.waitingInKitchen}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.acceptButton,
                {
                  flex: 1,
                  flexDirection: "row",
                  justifyContent: "center",
                  gap: 6,
                  backgroundColor: "#3B82F6",
                },
              ]}
              onPress={() => handleOpenDelivery(item)}
              accessibilityRole="button"
              accessibilityLabel={t.viewOrderLocation}
            >
              <Ionicons name="map-outline" size={18} color="#FFFFFF" />
              <Text style={[styles.acceptButtonText, { color: "#FFFFFF" }]}>
                {t.viewMap}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={[
              styles.acceptButton,
              {
                backgroundColor: isInTransit ? "#3B82F6" : colors.btnPrimary,
              },
            ]}
            onPress={() =>
              isInTransit ? handleOpenDelivery(item) : handleStartTrip(item)
            }
          >
            <Text style={[styles.acceptButtonText, { color: "#FFFFFF" }]}>
              {isInTransit ? t.viewRoute : t.goForOrder}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading)
    return (
      <SafeAreaView
        edges={["top"]}
        style={[styles.centered, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </SafeAreaView>
    );

  return (
    <SafeAreaView
      edges={["top"]}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "flex-end",
          paddingHorizontal: 16,
          paddingTop: 4,
        }}
      >
        <NotificationBell
          colors={colors}
          t={(key) => t[key] ?? key}
        />
      </View>
      {gpsError && hasInTransitDelivery && (
        <View style={{ marginHorizontal: 16, marginTop: 8, padding: 10, borderRadius: 8, backgroundColor: colors.warningBg }}>
          <Text style={{ color: colors.warningText, fontSize: 12 }}>{gpsError}</Text>
        </View>
      )}
      {startError && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            backgroundColor: colors.warningBg,
            padding: 12,
            marginHorizontal: 16,
            marginTop: 12,
            borderRadius: 10,
          }}
        >
          <Ionicons name="alert-circle-outline" size={18} color={colors.warningText} />
          <Text style={{ flex: 1, color: colors.warningText, fontWeight: "600" }}>
            {startError}
          </Text>
          <TouchableOpacity onPress={() => setStartError(null)}>
            <Ionicons name="close" size={18} color={colors.warningText} />
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
              {t.noAssignedOrders}
            </Text>
            <Text style={{ color: colors.muted, textAlign: "center", marginTop: 12, paddingHorizontal: 24 }}>
              {translateMobileCopy("Los pedidos pendientes se asignarán automáticamente cuando haya cupo en tu turno.")}
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
    </SafeAreaView>
  );
};;

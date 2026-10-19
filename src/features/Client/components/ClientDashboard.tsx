  import React, { useState, useRef, useEffect } from "react";
  import {
    View,
    Text,
    TouchableOpacity,
    FlatList,
    Modal,
    Animated,
    Platform,
    ScrollView,
    Alert,
    LayoutAnimation,
    Linking,
    ActivityIndicator,
  } from "react-native";
  import { SafeAreaView } from "react-native-safe-area-context";
  import { useCompleteProfile } from "@/features/customers/hooks/useCompleteProfile";
  import {
    PaymentStatus,
    PaymentMethod,
  } from "@/features/payments/types/payment.types";
  import { useWompiPolling } from "@/features/payments/hooks/useWompiPolling";
  import { buildWompiCheckoutUrl } from "@/features/payments/utils/wompiUrl";

  import { Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
  import { useRouter } from "expo-router";
  import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
  import { orderService } from "@/features/orders/services/orderService";
  import { paymentService } from "@/features/payments/services/paymentService";
  import { OrderType } from "@/features/orders/types/order.types";
  // 🔥 Importaciones modulares
  import * as Location from "expo-location";
  import { styles as baseStyles } from "./style/ClientStyles";
  import { getClientLocale, useClientPreferences, useClientThemedStyles } from "@/features/userPreferences/context/ClientPreferencesContext";
  import { useCatalog } from "@/features/catalog/hooks/useCatalog";
  import { useNearestBranch } from "@/features/branches/hooks/useNearestBranch";
import type { PublicBranch } from "@/features/branches/types/branch.types";
import { usePublicBranches } from "@/features/branches/hooks/usePublicBranches";
import { branchAvailabilityLabel, branchHoursLabel, branchIsUnavailable } from "@/features/branches/utils/branchAvailability";
import { showAppAlert } from "@/features/shared/services/alertEvents";
  import { useBranchSettings } from "@/features/branches/hooks/useBranchSettings";
  import {
    calcBreakdown,
    haversineKm,
    getRadiusMessages,
  } from "@/features/orders/utils/orderBreakdown";
  import { useAuth } from "@/features/auth/context/AuthContext";
  import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
  import { useAddresses } from "@/features/addresses/hooks/useAddresses";
  import { SERVER_BASE_URL } from "@/features/catalog/services/catalogService";
  import { ClientCheckoutModal } from "./ClientCheckoutModal";
  import { useCart } from "@/features/cart/hooks/useCart";
  import { BranchesMapModal } from "@/features/branches/components/BranchesMapModal";
  import { LocationPickerModal } from "@/features/branches/components/LocationPickerModal";
import { useActiveClientOrder } from "@/features/orders/hooks/useActiveClientOrder";
import { CancelOrderButton } from "@/features/orders/components/CancelOrderButton";
import { NotificationBell } from "@/features/notifications/components/NotificationBell";
import { useNotificationListener } from "@/features/notifications/context/UserNotificationsContext";
import { DeliveryStatus } from "@/features/delivery/types/delivery.types";
import { OrderTrackingModal } from "@/features/orders/components/OrderTrackingModal";


  export default function ClientDashboard() {
    const styles = useClientThemedStyles(baseStyles);
    const { colors, t, isDark, language } = useClientPreferences();
    const router = useRouter();
    const { activeOrder, refetch: refetchActiveOrder } = useActiveClientOrder();
    const { customer } = useCompleteProfile();
    const customerDisplayName = [customer?.name, customer?.lastName]
      .map((part) =>
        part
          ?.trim()
          .split(/\s+/)
          .filter(Boolean)
          .map(
            (word) =>
              `${word.charAt(0).toLocaleUpperCase(language)}${word.slice(1).toLocaleLowerCase(language)}`,
          )
          .join(" "),
      )
      .filter(Boolean)
      .join(" ");
    const { user } = useAuth();
    const customerId = user?.token ? getCustomerIdFromToken(user.token) : null;
    const {
      addresses,
      loading: loadingAddresses,
      createAddress,
      setDefaultAddress,
    } = useAddresses(customerId);
    const [selectedAddressId, setSelectedAddressId] = useState<number | null>(
      null,
    );
    const [showAddressPicker, setShowAddressPicker] = useState(false);
    const [showAllAddresses, setShowAllAddresses] = useState(false);

    const [showBranchesMap, setShowBranchesMap] = useState(false);
    const [showLocationPicker, setShowLocationPicker] = useState(false);
    const [savingMapLocation, setSavingMapLocation] = useState(false);
    const [showDeliveryOptions, setShowDeliveryOptions] = useState(false);
    const [trackingOrderId, setTrackingOrderId] = useState<number | null>(null);
    const [manualBranch, setManualBranch] = useState<PublicBranch | null>(null);
    useEffect(() => {
      if (loadingAddresses) return;
      if (
        selectedAddressId &&
        addresses.some((a) => a.id === selectedAddressId)
      )
        return;
      if (addresses.length > 0) {
        setSelectedAddressId(addresses[0].id);
        // Si el cliente ya tiene una dirección real guardada, dejamos de usar
        // el GPS "de bienvenida" y volvemos al flujo normal por dirección.
        setLiveLocation(null);
      }
    }, [loadingAddresses, addresses]);

    // La sede se calcula normalmente a partir de la dirección guardada
    // seleccionada, pero el cliente puede pedir usar su GPS en vivo en
    // su lugar (útil si está en un sitio distinto al de la dirección).
    const selectedAddress =
      addresses.find((a) => a.id === selectedAddressId) ?? null;
    // Con muchas direcciones solo se muestran las primeras 3 (la predeterminada
    // va primero). Si la elegida está más abajo, se incluye para que se vea marcada.
    const ADDRESS_PREVIEW_COUNT = 3;
    const previewAddresses = addresses.slice(0, ADDRESS_PREVIEW_COUNT);
    const selectedIsHidden =
      selectedAddress != null &&
      !previewAddresses.some((a) => a.id === selectedAddress.id);
    const visibleAddresses = showAllAddresses
      ? addresses
      : selectedIsHidden
        ? [
            ...previewAddresses.slice(0, ADDRESS_PREVIEW_COUNT - 1),
            selectedAddress!,
          ]
        : previewAddresses;
    const hiddenCount = addresses.length - visibleAddresses.length;

    const [liveLocation, setLiveLocation] = useState<{
      latitude: number;
      longitude: number;
    } | null>(null);
    const [locatingGps, setLocatingGps] = useState(false);

    const coordsForBranch = liveLocation ?? selectedAddress ?? null;

    const {
      branch: nearestBranch,
      loading: loadingBranch,
      error: branchError,
    } = useNearestBranch(coordsForBranch?.latitude, coordsForBranch?.longitude);
    const selectedDeliveryBranch = manualBranch ?? nearestBranch;
    const { branches: publicBranches } = usePublicBranches();
    const deliveryBranch = publicBranches.find(b => b.id === selectedDeliveryBranch?.id)
      ?? selectedDeliveryBranch;
    const branchUnavailable = branchIsUnavailable(deliveryBranch);
    const branchClosedMessage = deliveryBranch
      ? (deliveryBranch.unavailableReason || branchHoursLabel(deliveryBranch, language))
      : "No se pudo verificar la sede.";
    const ensureBranchOpen = () => {
      if (!branchUnavailable) return true;
      showAppAlert("Sede no disponible", branchClosedMessage);
      return false;
    };

    const { settings: branchSettings, loading: loadingSettings } =
      useBranchSettings(deliveryBranch?.id);
    const radiusMsgs = getRadiusMessages(language);
    const {
      categories,
      products,
      loading: loadingCatalog,
    } = useCatalog(deliveryBranch?.id);

    // Incluye el instante entre "direcciones cargadas" y "dirección seleccionada",
    // donde las coordenadas aún son null y se vería un falso "sin sede".
    const resolvingLocation =
      loadingAddresses ||
      locatingGps ||
      (!manualBranch && loadingBranch) ||
      (addresses.length > 0 && !coordsForBranch);
    // Convierte unas coordenadas en dirección guardada y la deja seleccionada
    // como dirección de entrega del pedido.
    const saveLocationAsAddress = async (
      coords: { latitude: number; longitude: number },
      isDefault: boolean,
      exactAddress?: string,
    ): Promise<boolean> => {
      try {
        if (!customerId) throw new Error("No se identificó la cuenta del cliente.");
        let addressLine = exactAddress?.trim() || "Ubicación actual";
        if (!exactAddress?.trim()) {
          try {
            const [place] = await Location.reverseGeocodeAsync(coords);
            if (place) {
              const parts = [place.street, place.name, place.city].filter(Boolean);
              if (parts.length > 0) addressLine = parts.join(", ");
            }
          } catch {
            // El cliente puede editar luego una dirección aproximada.
          }
        }

        const created = await createAddress({
          addressLine,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isDefault,
        });
        setManualBranch(null);
        setSelectedAddressId(created.id);
        setLiveLocation(null);
        return true;
      } catch (err: any) {
        Alert.alert(
          t("error"),
          err?.message ?? t("addressSaveError"),
        );
        return false;
      }
    };
    const handleUseCurrentLocationForBranch = async () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setLocatingGps(true);
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setShowLocationPicker(true); // sin GPS, que la marque en el mapa
          return;
        }

        const position = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        const here = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setManualBranch(null);
        setLiveLocation(here);

        // Cliente sin direcciones: se guarda como su primera dirección.
        if (addresses.length === 0) {
          await saveLocationAsAddress(here, true);
        }
      } catch (err) {
        Alert.alert(
          t("error"),
          t("locationError"),
        );
      } finally {
        setLocatingGps(false);
      }
    };

    // Si el cliente elige explícitamente otra dirección guardada, volvemos
    // a calcular la sede a partir de esa dirección (se cancela el modo GPS).
    const handleSelectAddress = async (addressId: number) => {
      if (addressId === selectedAddressId) {
        setShowAddressPicker(false);
        return;
      }
      if (addressId !== selectedAddressId && cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setManualBranch(null);
      setLiveLocation(null);
      setSelectedAddressId(addressId);
      setShowAddressPicker(false);

      // La última dirección elegida queda como predeterminada. El backend
      // rechaza marcar como predeterminada una que ya lo es, por eso se revisa.
      const chosen = addresses.find((a) => a.id === addressId);
      if (chosen && !chosen.isDefault) {
        try {
          await setDefaultAddress(addressId);
        } catch {
          // Si falla, la dirección sigue elegida para este pedido.
        }
      }
    };

    // Cliente nuevo sin direcciones guardadas: pedimos el GPS automáticamente
    // una sola vez, así no ve el menú vacío mientras crea su primera dirección.
    const autoGpsRequested = useRef(false);
    useEffect(() => {
      if (loadingAddresses) return;
      if (addresses.length > 0) return;
      if (autoGpsRequested.current) return;

      autoGpsRequested.current = true;
      handleUseCurrentLocationForBranch();
    }, [loadingAddresses, addresses]);
    // Estados Generales
    const [activeCategory, setActiveCategory] = useRememberedUiState<string>("client:category", "__all__");
    const { cart, addItem, removeItem, clearCart } = useCart();

    const handleOpenBranchPicker = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowBranchesMap(true);
    };
    const handleOpenLocationPicker = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowLocationPicker(true);
    };
    const handleOpenDeliveryOptions = () => {
      if (cart.length > 0) {
        Alert.alert(t("cartMustBeEmptyTitle"), t("cartMustBeEmptyForLocation"));
        return;
      }
      setShowDeliveryOptions(true);
    };
    const switchDeliveryOptionsTo = (openModal: () => void) => {
      setShowDeliveryOptions(false);
      setTimeout(openModal, 200);
    };

    // Modales
    const [cartModalVisible, setCartModalVisible] = useState(false);
    const [confirmItemModalVisible, setConfirmItemModalVisible] =
      useState(false);
    const [itemToConfirm, setItemToConfirm] = useState<any | null>(null);

    // Estados de flujo de pago
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState("");
    const [receiptUploaded, setReceiptUploaded] = useState(false);
    const [orderConfirmed, setOrderConfirmed] = useState(false);
        const [orderPaid, setOrderPaid] = useState(false);

    // Animaciones Toast
    const toastAnim = useRef(new Animated.Value(-100)).current;
    const [toastMessage, setToastMessage] = useState("");

    const categoryNames = [
      "__all__",
      ...categories
        .map((c) => c.name)
        .filter((name) => products.some((p) => p.categoryName === name)),
    ];

    useEffect(() => {
      if (products.length > 0 && categories.length > 0 && !categoryNames.includes(activeCategory)) setActiveCategory("__all__");
    }, [products, categories]);
    const filteredMenu = (
      activeCategory === "__all__"
        ? products
        : products.filter((p) => p.categoryName === activeCategory)
    ).map((p) => ({
      id: String(p.id),
      name: p.name,
      category: p.categoryName,
      price: p.price,
      desc: p.description,
      image: p.photo ? `${SERVER_BASE_URL}${p.photo}` : null,
    }));
     const subtotalCart = cart.reduce((sum, item) => sum + item.price, 0);
    const breakdown = calcBreakdown(
      subtotalCart,
      branchSettings?.taxRate ?? 0,
      branchSettings?.deliveryFee ?? 0,
    );
    // El desglose calcula el Impoconsumo sobre productos; el domicilio se suma aparte.
    const totalCart = breakdown.total;

    // Distancia sede ↔ ubicación elegida, para avisar ANTES de pagar.
    // El backend vuelve a validar al crear el pedido.
    const distanceKm =
      coordsForBranch &&
      deliveryBranch?.latitude != null &&
      deliveryBranch?.longitude != null
        ? haversineKm(
            coordsForBranch.latitude,
            coordsForBranch.longitude,
            Number(deliveryBranch.latitude),
            Number(deliveryBranch.longitude),
          )
        : null;
    const outOfRadius =
      distanceKm != null &&
      !!branchSettings &&
      !branchSettings.isDefault &&
      distanceKm > branchSettings.deliveryRadiusKm;
    const radiusText =
      outOfRadius && branchSettings && deliveryBranch
        ? radiusMsgs.radiusBody(
            distanceKm!.toFixed(1),
            String(branchSettings.deliveryRadiusKm),
            deliveryBranch.name,
          )
        : "";
    const showToast = (message: string) => {
      setToastMessage(message);
      Animated.sequence([
        Animated.timing(toastAnim, {
          toValue: Platform.OS === "ios" ? 50 : 20,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(1500),
        Animated.timing(toastAnim, {
          toValue: -100,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    };

    const handleItemPress = (item: any) => {
      setItemToConfirm(item);
      setConfirmItemModalVisible(true);
    };

    const confirmAddToCart = () => {
      if (itemToConfirm) {
        addItem(itemToConfirm);
        showToast(`🛒 ${itemToConfirm.name} ${t("added")}`);
        setConfirmItemModalVisible(false);
        setItemToConfirm(null);
      }
    };

    const removeFromCart = (cartId: string) => {
      removeItem(cartId);
      if (cart.length === 1) handleCloseCart();
    };

    const handleCloseCart = () => {
      setCartModalVisible(false);
      setIsCheckingOut(false);
      setIsUploadingReceipt(false);
      setPaymentMethod("");
      setReceiptUploaded(false);
    };

    const validateDeliveryCoverage = () => {
      if (!branchSettings || branchSettings.isDefault) {
        Alert.alert(radiusMsgs.notConfiguredTitle, radiusMsgs.notConfiguredBody);
        return false;
      }
      // La advertencia roja visible explica el motivo y también aparece dentro
      // del carrito; no se abre un segundo cuadro de alerta.
      if (outOfRadius) return false;
      if (liveLocation) {
        Alert.alert(
          t("saveLocationBeforeOrderTitle"),
          t("saveLocationBeforeOrderMessage"),
        );
        return false;
      }
      return true;
    };

    const proceedToCheckout = () => {
      if (cart.length === 0 || loadingSettings) return;
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(true);
    };

    const handlePaymentNextStep = () => {
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      if (!paymentMethod)
        return Alert.alert(
          t("selectPaymentTitle"),
          t("selectPaymentMessage"),
        );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(false);
      setIsUploadingReceipt(true);
    };

    const handleFakeUploadReceipt = () => {
      setReceiptUploaded(true);
      showToast(`✅ ${t("receiptUploaded")}`);
    };

    const [submitting, setSubmitting] = useState(false);
    const { polling, startPolling, stopPolling } = useWompiPolling();
    // Pedido/pago Wompi en curso, para poder cancelarlo si no se paga
    const wompiInFlightRef = useRef<{
      orderId: number;
      paymentId: number;
    } | null>(null);

    const finishOrderSuccess = (paid: boolean = false) => {
      wompiInFlightRef.current = null;
      setOrderPaid(paid);
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setOrderConfirmed(true);
      setIsUploadingReceipt(false);

      setTimeout(() => {
        setOrderConfirmed(false);
        handleCloseCart();
        clearCart();
      }, 4000);
    };

    // Cancela el pedido que quedó sin pagar. Antes revisa con Wompi si el
    // pago alcanzó a aprobarse; en ese caso lo da por bueno y NO cancela.
    // Devuelve true si el pedido terminó pagado.
    const abandonUnpaidWompiOrder = async (reason: string): Promise<boolean> => {
      const inFlight = wompiInFlightRef.current;
      if (!inFlight) return false;
      wompiInFlightRef.current = null;

      try {
        const payment = await paymentService.syncWompi(inFlight.paymentId);
        if (payment.status === PaymentStatus.Completed) {
          finishOrderSuccess(true);
          return true;
        }
      } catch {
        // si no se puede verificar, se intenta cancelar igual
      }

      try {
        await orderService.cancelMine(inFlight.orderId, reason);
      } catch {
        // el backend rechaza cancelar si ya está pagado; no es un error grave
      }
      refetchActiveOrder();
      return false;
    };

    // Botón "Cancelar espera" del modal
    const handleStopWaiting = async () => {
      stopPolling();
      const paid = await abandonUnpaidWompiOrder(
        "Cancelado por el cliente: no completó el pago",
      );
      if (!paid) {
        Alert.alert(
          t("orderCancelledTitle"),
          t("orderCancelledMessage"),
        );
      }
    };
    useNotificationListener((n) => {
      const inFlight = wompiInFlightRef.current;
      if (
        n.type === "PaymentConfirmed" &&
        inFlight &&
        n.relatedEntityId === inFlight.orderId
      ) {
        stopPolling();
        finishOrderSuccess(true);
      }
    });
    const submitFinalOrder = async () => {
      if (submitting || polling) return;
      if (!ensureBranchOpen() || !validateDeliveryCoverage()) return;
      if (!selectedAddressId) {
        Alert.alert(
          t("selectAddressTitle"),
          t("selectAddressMessage"),
        );
        return;
      }
      if (paymentMethod !== "efectivo" && paymentMethod !== "wompi") return;

      setSubmitting(true);
      let createdOrderId: number | null = null;
      let handedOff = false; // true cuando el flujo ya no depende de este try
      try {
        const order = await orderService.create({
          customerId,
          addressId: selectedAddressId,
          branchId: deliveryBranch?.id,
          tableId: null,
          orderType: OrderType.Delivery,
          notes: null,
        });
        createdOrderId = order.id;

        await orderService.addDetails(
          order.id,
          cart.map((item: any) => ({
            productId: Number(item.id),
            quantity: 1,
            notes: null,
          })),
        );


        if (paymentMethod === "wompi") {
          // El backend calcula el monto real desde el pedido; este valor se ignora
          const widget = await paymentService.initWompi({
            orderId: order.id,
            amount: totalCart,
          });

          wompiInFlightRef.current = {
            orderId: order.id,
            paymentId: widget.paymentId,
          };

          startPolling(
            widget.paymentId,
            async (finalStatus) => {
              if (finalStatus === PaymentStatus.Completed) {
                if (wompiInFlightRef.current) finishOrderSuccess(true);
              } else {
                // Rechazado: se cancela para que no quede nada colgado
                await abandonUnpaidWompiOrder(
                  "Cancelado automáticamente: el pago fue rechazado",
                );
                Alert.alert(
                  t("paymentRejectedTitle"),
                  t("paymentRejectedMessage"),
                );
              }
            },
            () => {
              // Tiempo agotado: NO se cancela (Nequi puede aprobar tarde).
              // El cajero no lo verá hasta que el pago quede Completed.
              Alert.alert(
                t("paymentUnconfirmedTitle"),
                t("paymentUnconfirmedMessage"),
              );
            },
          );
          handedOff = true;

          await Linking.openURL(
            buildWompiCheckoutUrl(widget, "https://wompi.co/"),
          );
          return;
        }

        // Efectivo: queda Pending hasta que el cajero lo confirme
        handedOff = true;
        try {
          // Avisa al cajero/admin con sonido (no debe bloquear al cliente si falla)
          await orderService.confirmCash(order.id);
        } catch {
          // El pedido ya existe; el cajero lo verá igual en su lista.
        }
        finishOrderSuccess();
      } catch (err: any) {
        // Si algo falló antes de entregar el flujo (crear detalles o iniciar
        // Wompi), se cancela para no dejar un pedido que el cajero pueda ver.
        if (createdOrderId && !handedOff) {
          try {
            await orderService.cancel(
              createdOrderId,
              "Cancelado automáticamente: no se pudo completar el pedido",
            );
          } catch {
            // Si tampoco se puede cancelar, no se interrumpe el mensaje de error.
          }
        }
        Alert.alert(
          t("error"),
          err?.message ?? t("createOrderError"),
        );
      } finally {
        setSubmitting(false);
      }
    };

    return (
      <SafeAreaView style={styles.container}>
        {/* TOAST ANIMADO */}
        <Animated.View
          style={[
            styles.toastContainer,
            { transform: [{ translateY: toastAnim }] },
          ]}
        >
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>

        {/* HEADER */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.greeting} numberOfLines={1}>
                {customerDisplayName}
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NotificationBell />
            <TouchableOpacity
              style={styles.cartButtonHeader}
              onPress={() => setCartModalVisible(true)}
            >
              <Ionicons name="cart" size={24} color={colors.text} />
              {cart.length > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{cart.length}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* SELECTOR DE DIRECCIÓN */}
        {!loadingAddresses && (
          <TouchableOpacity
            style={{
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              paddingVertical: 10,
              backgroundColor: isDark ? "#3B2024" : "#FEF2F2",
              gap: 8,
            }}
            onPress={handleOpenLocationPicker}
          >
            <Ionicons name="location" size={18} color={colors.accent} />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: colors.text,
                flex: 1,
              }}
              numberOfLines={1}
            >
              <Text>{t("deliverTo")} </Text>
              <Text style={{ color: colors.accent }}>
                {addresses.find((a) => a.id === selectedAddressId)
                  ?.addressLine ?? t("addAddress")}
              </Text>
            </Text>
            <Ionicons name="chevron-down" size={16} color={colors.muted} />
          </TouchableOpacity>
        )}

        <View
          style={{
            paddingHorizontal: 16,
            paddingVertical: 10,
            backgroundColor: colors.background,
            gap: 8,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons name="map-outline" size={16} color={colors.accent} />
            <Text
              style={{ fontSize: 12, color: colors.muted, flex: 1 }}
              numberOfLines={1}
            >
              {(loadingBranch && !manualBranch)
                ? t("nearestBranch")
                : deliveryBranch
                  ? `${t("orderFrom")} ${deliveryBranch.name}${liveLocation ? ` (${t("currentLocation")})` : ""}`
                  : t("noBranch")}
            </Text>
            <TouchableOpacity
              onPress={handleOpenDeliveryOptions}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: colors.accent,
              }}
              accessibilityRole="button"
            >
              <Text style={{ color: colors.accent, fontSize: 11, fontWeight: "700" }}>
                {t("changeDelivery")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <Modal
          transparent
          visible={showAddressPicker}
          animationType="fade"
          onRequestClose={() => setShowAddressPicker(false)}
        >
          <View
            style={{
              flex: 1,
              backgroundColor: "rgba(0,0,0,0.5)",
              justifyContent: "center",
              padding: 24,
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 16,
                padding: 20,
                maxHeight: "60%",
              }}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "bold",
                  marginBottom: 12,
                  color: colors.text,
                }}
              >
                {t("whereDeliver")}
              </Text>

              {addresses.length === 0 ? (
                <Text style={{ color: colors.muted, marginBottom: 12 }}>
                  {t("noAddresses")}
                </Text>
              ) : (
                <>
                  <ScrollView style={{ maxHeight: 280 }}>
                    {visibleAddresses.map((a) => (
                      <TouchableOpacity
                        key={a.id}
                        style={{
                          padding: 14,
                          borderRadius: 10,
                          backgroundColor:
                            selectedAddressId === a.id
                              ? isDark
                                ? "#312020"
                                : "#FEF2F2"
                              : colors.background,
                          marginBottom: 8,
                        }}
                        onPress={() => handleSelectAddress(a.id)}
                      >
                        <Text style={{ fontWeight: "700", color: colors.text }}>
                          {a.addressLine}
                        </Text>
                        {a.reference ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: colors.muted,
                              marginTop: 2,
                            }}
                          >
                            {a.reference}
                          </Text>
                        ) : null}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {addresses.length > ADDRESS_PREVIEW_COUNT && (
                    <TouchableOpacity
                      style={{ alignItems: "center", padding: 10 }}
                      onPress={() => setShowAllAddresses((v) => !v)}
                    >
                      <Text
                        style={{
                          color: isDark ? "#93C5FD" : "#3B82F6",
                          fontWeight: "700",
                        }}
                      >
                        {showAllAddresses
                          ? t("seeLess")
                          : `${t("all")} (${hiddenCount})`}
                      </Text>
                    </TouchableOpacity>
                  )}
                </>
              )}

              <TouchableOpacity
                style={{
                  marginTop: 8,
                  alignItems: "center",
                  padding: 12,
                  backgroundColor: isDark ? "#312020" : "#FEF2F2",
                  borderRadius: 10,
                }}
                onPress={() => {
                  setShowAddressPicker(false);
                  router.push("/client/addresses");
                }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {t("addNewAddress")}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 8, alignItems: "center", padding: 10 }}
                onPress={() => setShowAddressPicker(false)}
              >
                <Text style={{ color: colors.muted, fontWeight: "600" }}>
                  {t("close")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <Modal
          transparent
          visible={showDeliveryOptions}
          animationType="fade"
          onRequestClose={() => setShowDeliveryOptions(false)}
        >
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              padding: 24,
              backgroundColor: "rgba(0,0,0,0.5)",
            }}
          >
            <View
              style={{
                backgroundColor: colors.surface,
                borderRadius: 20,
                padding: 20,
                gap: 12,
              }}
            >
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: "800" }}>
                {t("deliveryOptionsTitle")}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  switchDeliveryOptionsTo(handleOpenLocationPicker);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="location-outline" size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {t("changeLocation")}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    {t("deliveryAddressOptionDesc")}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  switchDeliveryOptionsTo(handleOpenBranchPicker);
                }}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                  padding: 14,
                  borderRadius: 12,
                  backgroundColor: colors.background,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <Ionicons name="storefront-outline" size={22} color={colors.accent} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {t("changeBranch")}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12, marginTop: 3 }}>
                    {t("deliveryBranchOptionDesc")}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setShowDeliveryOptions(false)}
                style={{ alignSelf: "flex-end", paddingHorizontal: 12, paddingVertical: 8 }}
              >
                <Text style={{ color: colors.accent, fontWeight: "700" }}>
                  {t("cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {branchUnavailable && deliveryBranch && (
          <View style={{ marginHorizontal: 16, marginBottom: 8, padding: 12,
            borderRadius: 10, backgroundColor: "#FEF2F2", borderColor: "#FCA5A5", borderWidth: 1 }}>
            <Text style={{ color: "#991B1B", fontWeight: "800" }}>
              {branchAvailabilityLabel(deliveryBranch, language)}
            </Text>
            <Text style={{ marginTop: 3, color: "#991B1B", fontSize: 12 }}>
              {branchHoursLabel(deliveryBranch, language)}
            </Text>
            <Text style={{ marginTop: 3, color: "#991B1B", fontSize: 12 }}>
              {branchClosedMessage}
            </Text>
          </View>
        )}
        {outOfRadius && !cartModalVisible && (
          <View
            style={{
              marginHorizontal: 16,
              marginBottom: 8,
              padding: 12,
              borderRadius: 10,
              backgroundColor: "#FEE2E2",
              borderWidth: 1,
              borderColor: "#FCA5A5",
            }}
          >
            <Text
              style={{ color: "#991B1B", fontWeight: "700", marginBottom: 2 }}
            >
              {radiusMsgs.radiusTitle}
            </Text>
            <Text style={{ color: "#991B1B", fontSize: 12 }}>{radiusText}</Text>
            <TouchableOpacity
              onPress={handleOpenDeliveryOptions}
              style={{ alignSelf: "flex-start", marginTop: 8, paddingVertical: 4 }}
              accessibilityRole="button"
            >
              <Text style={{ color: "#7F1D1D", fontSize: 12, fontWeight: "800" }}>
                {t("changeDelivery")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
        <BranchesMapModal
          visible={showBranchesMap}
          onClose={() => setShowBranchesMap(false)}
          nearestBranchId={nearestBranch?.id}
          selectedBranchId={deliveryBranch?.id}
          onSelectBranch={(branch) => {
            setManualBranch(
              branch.id === nearestBranch?.id ? null : branch,
            );
          }}
          userLocation={
            coordsForBranch
              ? {
                  latitude: coordsForBranch.latitude,
                  longitude: coordsForBranch.longitude,
                }
              : null
          }
        />

        <LocationPickerModal
          visible={showLocationPicker}
          onClose={() => { if (!savingMapLocation) setShowLocationPicker(false); }}
          savedAddresses={addresses}
          selectedAddressId={selectedAddressId}
          saving={savingMapLocation}
          onChooseSavedAddress={(id) => {
            void handleSelectAddress(id);
            setShowLocationPicker(false);
          }}
          initialLocation={
            coordsForBranch
              ? {
                  latitude: coordsForBranch.latitude,
                  longitude: coordsForBranch.longitude,
                }
              : null
          }
          onConfirm={(coords, exactAddress) => {
            if (savingMapLocation) return;
            setSavingMapLocation(true);
            void saveLocationAsAddress(coords, true, exactAddress)
              .then((saved) => {
                if (saved) setShowLocationPicker(false);
              })
              .finally(() => setSavingMapLocation(false));
          }}
        />
        {/* PEDIDO EN CURSO */}
        {activeOrder && (
          <View
            style={{
              marginHorizontal: 16,
              marginVertical: 8,
              padding: 12,
              borderRadius: 12,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: colors.text }}>
              {t("orderNumber")} #{activeOrder.order.id} ·{" "}
              {activeOrder.step === 1
                ? t("preparing")
                : activeOrder.step === 2
                  ? t("onTheWay")
                  : t("delivered")}
            </Text>
            <CancelOrderButton
              order={activeOrder.order}
              onCancelled={refetchActiveOrder}
            />
            {activeOrder.delivery?.status === DeliveryStatus.InTransit && (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setTrackingOrderId(activeOrder.order.id)}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  marginTop: 4,
                  paddingVertical: 12,
                  paddingHorizontal: 16,
                  borderRadius: 12,
                  backgroundColor: "#2563EB",
                }}
              >
                <Ionicons name="map-outline" size={18} color="#FFFFFF" />
                <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                  {t("trackDriverMap")}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        {/* CATEGORÍAS: solo si la sede tiene productos */}
        {products.length > 0 && (
          <View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.categoriesContainer}
            >
              {categoryNames.map((cat, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryBtn,
                    activeCategory === cat && styles.categoryBtnActive,
                  ]}
                  onPress={() => {
                    LayoutAnimation.configureNext(
                      LayoutAnimation.Presets.easeInEaseOut,
                    );
                    setActiveCategory(cat);
                  }}
                >
                  <Text
                    style={[
                      styles.categoryText,
                      activeCategory === cat && styles.categoryTextActive,
                    ]}
                  >
                    {cat === "__all__" ? t("all") : cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* MENÚ PRINCIPAL */}
        <FlatList
          data={filteredMenu}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.menuList}
          ListEmptyComponent={
            resolvingLocation || loadingCatalog ? (
              <View style={{ alignItems: "center", padding: 40, gap: 12 }}>
                <ActivityIndicator size="large" color={colors.accent} />
                <Text style={{ color: colors.muted }}>
                  {resolvingLocation ? t("nearestBranch") : t("loadingMenu")}
                </Text>
              </View>
            ) : !deliveryBranch ? (
              <View style={{ alignItems: "center", padding: 32, gap: 12 }}>
                <Ionicons name="location-outline" size={48} color="#94A3B8" />
                <Text
                  style={{
                    color: colors.text,
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {branchError ? t("noCoverage") : t("chooseAddress")}
                </Text>
                <TouchableOpacity
                  onPress={handleOpenLocationPicker}
                  style={{
                    backgroundColor: "#E61C24",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    {t("useLocation")}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={{
                  textAlign: "center",
                  color: colors.muted,
                  padding: 32,
                }}
              >
                {t("noProducts")}
              </Text>
            )
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.menuCard}
              activeOpacity={0.7}
              onPress={() => handleItemPress(item)}
            >
              <View style={styles.menuCardImagePlaceholder}>
                {item.image ? (
                  <ExpoImage
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                    recyclingKey={item.image}
                  />
                ) : (
                  <Text style={{ fontSize: 40 }}>🍽️</Text>
                )}
              </View>
              <View style={styles.menuCardInfo}>
                <Text style={styles.menuCardTitle}>{item.name}</Text>
                <Text style={styles.menuCardDesc} numberOfLines={2}>
                  {item.desc}
                </Text>
                <View style={styles.menuCardFooter}>
                  <Text style={styles.menuCardPrice}>
                    ${item.price.toLocaleString(getClientLocale(language))}
                  </Text>
                  <View style={styles.addButton}>
                    <Ionicons name="add" size={20} color="#FFF" />
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* BOTÓN FLOTANTE CARRITO */}
        {cart.length > 0 && (
          <TouchableOpacity
            style={styles.floatingCartBtn}
            onPress={() => setCartModalVisible(true)}
          >
            <View style={styles.floatingCartLeft}>
              <View style={styles.floatingCartCount}>
                <Text style={styles.floatingCartCountText}>{cart.length}</Text>
              </View>
              <Text style={styles.floatingCartText}>{t("cart")}</Text>
            </View>
            <Text style={styles.floatingCartTotal}>
              ${totalCart.toLocaleString(getClientLocale(language))}
            </Text>
          </TouchableOpacity>
        )}

        {/* MODAL 1: CONFIRMAR PRODUCTO */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={confirmItemModalVisible}
          onRequestClose={() => setConfirmItemModalVisible(false)}
        >
          <View style={styles.confirmOverlay}>
            <View style={styles.confirmBox}>
              <View style={styles.confirmImageCircle}>
                {itemToConfirm?.image ? (
                  <ExpoImage
                    source={{ uri: itemToConfirm.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 999 }}
                    contentFit="cover"
                    cachePolicy="memory-disk"
                    transition={120}
                  />
                ) : (
                  <Text style={{ fontSize: 50 }}>🍽️</Text>
                )}
              </View>
              <Text style={styles.confirmTitle}>{t("addToCart")}</Text>
              <Text style={styles.confirmItemName}>{itemToConfirm?.name}</Text>
              <Text style={styles.confirmItemPrice}>
                $
                {itemToConfirm?.price.toLocaleString(getClientLocale(language))}
              </Text>
              <Text style={styles.confirmDesc}>{itemToConfirm?.desc}</Text>
              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmItemModalVisible(false)}
                >
                  <Text style={styles.confirmCancelText}>{t("cancel")}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.confirmAcceptBtn}
                  onPress={confirmAddToCart}
                >
                  <Ionicons
                    name="cart"
                    size={18}
                    color="#FFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.confirmAcceptText}>{t("add")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* 🔥 COMPONENTE SEPARADO: MODAL DE CHECKOUT */}
        <ClientCheckoutModal
          cartModalVisible={cartModalVisible}
          handleCloseCart={handleCloseCart}
          orderConfirmed={orderConfirmed}
          isUploadingReceipt={isUploadingReceipt}
          isCheckingOut={isCheckingOut}
          cart={cart}
          removeFromCart={removeFromCart}
        totalCart={totalCart}
          breakdown={breakdown}
          proceedToCheckout={proceedToCheckout}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          handlePaymentNextStep={handlePaymentNextStep}
          receiptUploaded={receiptUploaded}
          setReceiptUploaded={setReceiptUploaded}
          handleFakeUploadReceipt={handleFakeUploadReceipt}
          submitFinalOrder={submitFinalOrder}
          setIsUploadingReceipt={setIsUploadingReceipt}
          setIsCheckingOut={setIsCheckingOut}
          submitting={submitting}
          waitingPayment={polling}
          orderPaid={orderPaid}
          stopWaiting={handleStopWaiting}
          outOfRadius={outOfRadius}
          branchUnavailable={branchUnavailable}
          radiusTitle={radiusMsgs.radiusTitle}
          radiusText={radiusText}
        />
        <OrderTrackingModal
          visible={trackingOrderId === activeOrder?.order.id}
          order={trackingOrderId === activeOrder?.order.id ? activeOrder.order : null}
          onClose={() => setTrackingOrderId(null)}
          onRate={() => {
            setTrackingOrderId(null);
            router.push("/client/profile");
          }}
        />
      </SafeAreaView>
    );
  }

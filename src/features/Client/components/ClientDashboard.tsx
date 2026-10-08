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
    Image,
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
  import { useRouter } from "expo-router";
  import { orderService } from "@/features/orders/services/orderService";
  import { paymentService } from "@/features/payments/services/paymentService";
  import { OrderType } from "@/features/orders/types/order.types";
  // 🔥 Importaciones modulares
  import * as Location from "expo-location";
  import { styles } from "./style/ClientStyles";
  import { useCatalog } from "@/features/catalog/hooks/useCatalog";
  import { useNearestBranch } from "@/features/branches/hooks/useNearestBranch";
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


  export default function ClientDashboard() {
    const router = useRouter();
    const { activeOrder, refetch: refetchActiveOrder } = useActiveClientOrder();
    const { customer } = useCompleteProfile();
    const firstName = customer?.name?.trim().split(" ")[0];

    // Saludo según la hora del día
    const hour = new Date().getHours();
    const greetingText =
      hour < 12 ? "Buenos días" : hour < 19 ? "Buenas tardes" : "Buenas noches";
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

    const {
      categories,
      products,
      loading: loadingCatalog,
    } = useCatalog(nearestBranch?.id);

    // Incluye el instante entre "direcciones cargadas" y "dirección seleccionada",
    // donde las coordenadas aún son null y se vería un falso "sin sede".
    const resolvingLocation =
      loadingAddresses ||
      locatingGps ||
      loadingBranch ||
      (addresses.length > 0 && !coordsForBranch);
    // Convierte unas coordenadas en dirección guardada y la deja seleccionada
    // como dirección de entrega del pedido.
    const saveLocationAsAddress = async (
      coords: { latitude: number; longitude: number },
      isDefault: boolean,
    ) => {
      try {
        let addressLine = "Ubicación actual";
        try {
          const [place] = await Location.reverseGeocodeAsync(coords);
          if (place) {
            const parts = [place.street, place.name, place.city].filter(
              Boolean,
            );
            if (parts.length > 0) addressLine = parts.join(", ");
          }
        } catch {
          // Si no se puede obtener el texto, se queda con "Ubicación actual".
        }

        const created = await createAddress({
          addressLine,
          latitude: coords.latitude,
          longitude: coords.longitude,
          isDefault,
        });
        setSelectedAddressId(created.id);
        setLiveLocation(null);
      } catch (err: any) {
        Alert.alert(
          "Error",
          err?.message ?? "No se pudo guardar la dirección.",
        );
      }
    };
    const handleUseCurrentLocationForBranch = async () => {
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
        setLiveLocation(here);

        // Cliente sin direcciones: se guarda como su primera dirección.
        if (addresses.length === 0) {
          await saveLocationAsAddress(here, true);
        }
      } catch (err) {
        Alert.alert(
          "Error",
          "No se pudo obtener tu ubicación actual. Intenta de nuevo.",
        );
      } finally {
        setLocatingGps(false);
      }
    };

    // Si el cliente elige explícitamente otra dirección guardada, volvemos
    // a calcular la sede a partir de esa dirección (se cancela el modo GPS).
    const handleSelectAddress = async (addressId: number) => {
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
    const [activeCategory, setActiveCategory] = useState("Todos");
    const { cart, addItem, removeItem, clearCart } = useCart();

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
      "Todos",
      ...categories
        .map((c) => c.name)
        .filter((name) => products.some((p) => p.categoryName === name)),
    ];

    useEffect(() => {
      if (!categoryNames.includes(activeCategory)) setActiveCategory("Todos");
    }, [products, categories]);
    const filteredMenu = (
      activeCategory === "Todos"
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
    const totalCart = cart.reduce((sum, item) => sum + item.price, 0);

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
        showToast(`🛒 ${itemToConfirm.name} agregado`);
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

    const proceedToCheckout = () => {
      if (cart.length === 0) return;
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(true);
    };

    const handlePaymentNextStep = () => {
      if (!paymentMethod)
        return Alert.alert(
          "Selecciona un método de pago",
          "Debes elegir cómo deseas pagar antes de continuar.",
        );

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setIsCheckingOut(false);
      setIsUploadingReceipt(true);
    };

    const handleFakeUploadReceipt = () => {
      setReceiptUploaded(true);
      showToast("✅ Evidencia cargada correctamente");
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
          "Pedido cancelado",
          "No completaste el pago, así que el pedido no se envió.",
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
      if (
        [
          "PaymentConfirmed",
          "DeliveryAssigned",
          "OrderStatusChanged",
          "OrderReady",
          "Resync",
        ].includes(n.type)
      ) {
        refetchActiveOrder();
      }
    });
    const submitFinalOrder = async () => {
      if (submitting || polling) return;
      if (!selectedAddressId) {
        Alert.alert(
          "Selecciona una dirección",
          "Elige o agrega una dirección de entrega antes de continuar.",
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
                  "Pago no aprobado",
                  "Wompi no aprobó el pago y el pedido fue cancelado. Puedes intentarlo de nuevo.",
                );
              }
            },
            () => {
              // Tiempo agotado: NO se cancela (Nequi puede aprobar tarde).
              // El cajero no lo verá hasta que el pago quede Completed.
              Alert.alert(
                "No recibimos confirmación",
                "Si ya pagaste, tu pedido llegará en unos minutos. Si no, cancélalo desde 'Pedido en curso'.",
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
          "Error",
          err?.message ?? "No se pudo crear el pedido. Intenta de nuevo.",
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
            <View>
              <Text style={styles.greeting}>
                {`${greetingText}${firstName ? `, ${firstName}` : ""} 👋`}
              </Text>
              <Text style={styles.subtitle}>¿Qué vas a pedir hoy?</Text>
            </View>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            <NotificationBell />
            <TouchableOpacity
              style={styles.cartButtonHeader}
              onPress={() => setCartModalVisible(true)}
            >
              <Ionicons name="cart" size={24} color="#1E293B" />
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
              backgroundColor: "#FEF2F2",
              gap: 8,
            }}
            onPress={() => {
              setShowAllAddresses(false);
              setShowAddressPicker(true);
            }}
          >
            <Ionicons name="location" size={18} color="#E61C24" />
            <Text
              style={{
                fontSize: 13,
                fontWeight: "600",
                color: "#1E293B",
                flex: 1,
              }}
              numberOfLines={1}
            >
              <Text>Entregar en: </Text>
              <Text style={{ color: "#E61C24" }}>
                {addresses.find((a) => a.id === selectedAddressId)
                  ?.addressLine ?? "Agrega una dirección"}
              </Text>
            </Text>
            <Ionicons name="chevron-down" size={16} color="#64748B" />
          </TouchableOpacity>
        )}

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#F8FAFC",
          }}
        >
          <TouchableOpacity
            onPress={() => setShowBranchesMap(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              flex: 1,
            }}
          >
            <Ionicons name="map-outline" size={16} color="#E61C24" />
            <Text
              style={{ fontSize: 12, color: "#64748B", flex: 1 }}
              numberOfLines={1}
            >
              {loadingBranch
                ? "Buscando la sede más cercana..."
                : nearestBranch
                  ? `Pedido desde: ${nearestBranch.name}${liveLocation ? " (tu ubicación actual)" : ""}`
                  : "No se pudo calcular la sede"}
              {"  "}
              <Text style={{ color: "#E61C24", fontWeight: "700" }}>
                Ver mapa
              </Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowLocationPicker(true)}
            disabled={locatingGps}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 4,
              paddingLeft: 8,
            }}
          >
            {locatingGps ? (
              <ActivityIndicator size="small" color="#E61C24" />
            ) : (
              <Ionicons
                name={liveLocation ? "checkmark-circle" : "locate"}
                size={16}
                color={liveLocation ? "#10B981" : "#E61C24"}
              />
            )}
            <Text
              style={{
                fontSize: 11,
                fontWeight: "700",
                color: liveLocation ? "#10B981" : "#E61C24",
              }}
            >
              {liveLocation ? "Ubicación elegida" : "Cambiar ubicación"}
            </Text>
          </TouchableOpacity>
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
                backgroundColor: "#FFF",
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
                  color: "#1E293B",
                }}
              >
                ¿Dónde te entregamos?
              </Text>

              {addresses.length === 0 ? (
                <Text style={{ color: "#64748B", marginBottom: 12 }}>
                  Todavía no tienes direcciones guardadas.
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
                            selectedAddressId === a.id ? "#FEF2F2" : "#F8FAFC",
                          marginBottom: 8,
                        }}
                        onPress={() => handleSelectAddress(a.id)}
                      >
                        <Text style={{ fontWeight: "700", color: "#1E293B" }}>
                          {a.addressLine}
                        </Text>
                        {a.reference ? (
                          <Text
                            style={{
                              fontSize: 12,
                              color: "#64748B",
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
                      <Text style={{ color: "#3B82F6", fontWeight: "700" }}>
                        {showAllAddresses
                          ? "Ver menos"
                          : `Ver todas (${hiddenCount} más)`}
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
                  backgroundColor: "#FEF2F2",
                  borderRadius: 10,
                }}
                onPress={() => {
                  setShowAddressPicker(false);
                  router.push("/client/addresses");
                }}
              >
                <Text style={{ color: "#E61C24", fontWeight: "700" }}>
                  + Agregar nueva dirección
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={{ marginTop: 8, alignItems: "center", padding: 10 }}
                onPress={() => setShowAddressPicker(false)}
              >
                <Text style={{ color: "#64748B", fontWeight: "600" }}>
                  Cerrar
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <BranchesMapModal
          visible={showBranchesMap}
          onClose={() => setShowBranchesMap(false)}
          nearestBranchId={nearestBranch?.id}
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
          onClose={() => setShowLocationPicker(false)}
          initialLocation={
            coordsForBranch
              ? {
                  latitude: coordsForBranch.latitude,
                  longitude: coordsForBranch.longitude,
                }
              : null
          }
          onConfirm={(coords) => {
            setLiveLocation(coords);
            setShowLocationPicker(false);
            Alert.alert(
              "¿Usar esta ubicación?",
              "Puedes guardarla como tu dirección de entrega para hacer el pedido ahí.",
              [
                { text: "Solo ver la sede", style: "cancel" },
                {
                  text: "Guardar y usar",
                  onPress: () => saveLocationAsAddress(coords, true),
                },
              ],
            );
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
              backgroundColor: "#FFF",
              borderWidth: 1,
              borderColor: "#E2E8F0",
              gap: 8,
            }}
          >
            <Text style={{ fontWeight: "700", color: "#1E293B" }}>
              Pedido #{activeOrder.order.id} ·{" "}
              {activeOrder.step === 1
                ? "Preparando"
                : activeOrder.step === 2
                  ? "En camino"
                  : "Entregado"}
            </Text>
            <CancelOrderButton
              order={activeOrder.order}
              onCancelled={refetchActiveOrder}
            />
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
                    {cat}
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
                <ActivityIndicator size="large" color="#E61C24" />
                <Text style={{ color: "#64748B" }}>
                  {resolvingLocation
                    ? "Buscando la sede más cercana..."
                    : "Cargando menú..."}
                </Text>
              </View>
            ) : !nearestBranch ? (
              <View style={{ alignItems: "center", padding: 32, gap: 12 }}>
                <Ionicons name="location-outline" size={48} color="#94A3B8" />
                <Text
                  style={{
                    color: "#1E293B",
                    fontWeight: "700",
                    textAlign: "center",
                  }}
                >
                  {branchError
                    ? "No tenemos cobertura en esta ubicación"
                    : "Elige una dirección o usa tu ubicación para ver el menú"}
                </Text>
                <TouchableOpacity
                  onPress={() => setShowLocationPicker(true)}
                  style={{
                    backgroundColor: "#E61C24",
                    paddingHorizontal: 20,
                    paddingVertical: 10,
                    borderRadius: 10,
                  }}
                >
                  <Text style={{ color: "#FFF", fontWeight: "700" }}>
                    Usar mi ubicación
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text
                style={{ textAlign: "center", color: "#64748B", padding: 32 }}
              >
                No hay productos disponibles en esta sede.
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
                  <Image
                    source={{ uri: item.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 12 }}
                    resizeMode="cover"
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
                    ${item.price.toLocaleString("es-CO")}
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
              <Text style={styles.floatingCartText}>Ver carrito</Text>
            </View>
            <Text style={styles.floatingCartTotal}>
              ${totalCart.toLocaleString("es-CO")}
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
                  <Image
                    source={{ uri: itemToConfirm.image }}
                    style={{ width: "100%", height: "100%", borderRadius: 999 }}
                    resizeMode="cover"
                  />
                ) : (
                  <Text style={{ fontSize: 50 }}>🍽️</Text>
                )}
              </View>
              <Text style={styles.confirmTitle}>¿Agregar al carrito?</Text>
              <Text style={styles.confirmItemName}>{itemToConfirm?.name}</Text>
              <Text style={styles.confirmItemPrice}>
                ${itemToConfirm?.price.toLocaleString("es-CO")}
              </Text>
              <Text style={styles.confirmDesc}>{itemToConfirm?.desc}</Text>
              <View style={styles.confirmActionsRow}>
                <TouchableOpacity
                  style={styles.confirmCancelBtn}
                  onPress={() => setConfirmItemModalVisible(false)}
                >
                  <Text style={styles.confirmCancelText}>Cancelar</Text>
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
                  <Text style={styles.confirmAcceptText}>Agregar</Text>
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
        />
      </SafeAreaView>
    );
  }
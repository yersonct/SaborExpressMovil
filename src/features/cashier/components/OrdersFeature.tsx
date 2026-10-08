import { Ionicons } from "@expo/vector-icons";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  LayoutAnimation,
  Linking,
  Modal,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Order } from "./CashierData";
import { styles } from "../style/CashierStyles";
import {
  TRANSLATIONS,
  LanguageCode,
} from "./../../../locales/CashierTranslations";
import { paymentService } from "@/features/payments/services/paymentService";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/features/payments/types/payment.types";
import { useWompiPolling } from "@/features/payments/hooks/useWompiPolling";
import { buildWompiCheckoutUrl } from "@/features/payments/utils/wompiUrl";
import QRCode from "react-native-qrcode-svg";
import { invoiceService } from "@/features/invoices/services/invoiceService";
import { orderService } from "@/features/orders/services/orderService";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types/product.types";

// 🔥 AÑADIMOS 'isDark' A LOS PROPS PARA ESCUCHAR EL MODO OSCURO
export const OrdersFeature = ({
  orders,
  setOrders,
  markAsPaid,
  setPaidHistory,
  showToast,
  filterType,
  setActiveTab,
  lang = "es",
  isDark = false,
}: any) => {
  const t = TRANSLATIONS[lang as LanguageCode] || TRANSLATIONS["es"];

  // 🔥 PALETA DE COLORES DINÁMICA COMPLETA PARA EL CAJERO 🔥
  const colors = {
    background: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#0F172A" : "#F1F5F9",
    warningBg: isDark ? "#451a03" : "#FEF3C7",
    warningText: isDark ? "#fde68a" : "#92400E",
    warningBorder: isDark ? "#78350f" : "#FDE68A",
  };

  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const [cashierPaymentMethod, setCashierPaymentMethod] = useState<
    "efectivo" | "datafono" | "wompi" | ""
  >("");

  // Cobro por QR / Wompi
  const { startPolling, stopPolling, polling } = useWompiPolling();
  const [wompiQrUrl, setWompiQrUrl] = useState<string | null>(null);
  const [wompiQrAmount, setWompiQrAmount] = useState(0);
  const wompiPaymentIdRef = useRef<number | null>(null);
  const [catalogModalVisible, setCatalogModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [extraItemForTakeaway, setExtraItemForTakeaway] = useState(false);
  // Mientras se manda el extra al backend, para no dejar tocar el catálogo
  // dos veces y así no duplicar el producto por un doble toque.
  const [addingExtra, setAddingExtra] = useState(false);
  // Producto que el cajero tocó "Añadir" y está pendiente de confirmar.
  const [pendingProduct, setPendingProduct] = useState<Product | null>(null);
  const [pendingQuantity, setPendingQuantity] = useState(1);

  const openAddConfirmation = (item: Product) => {
    setPendingQuantity(1);
    setPendingProduct(item);
  };

  const [orderType, setOrderType] = useState<"mesa" | "llevar">("mesa");
  const [printReceipt, setPrintReceipt] = useState(false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  // Saldo real pendiente (total del pedido menos lo ya pagado antes).
  // null mientras se consulta; evita cobrar el total completo si el
  // pedido ya tuvo un pago parcial/previo registrado en el backend.
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Catálogo REAL del backend (antes era MENU_ITEMS, una lista inventada
  // sin relación con los productos reales — por eso "Agregar extra" nunca
  // llegaba a cocina: mandaba un productId que no existía).
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const filteredMenu = useMemo(() => {
    return products.filter((item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [products, searchQuery]);

  const openPaymentModal = async (order: Order) => {
    setSelectedOrder(order);
    setPrintReceipt(false);
    stopPolling();
    setWompiQrUrl(null);
    wompiPaymentIdRef.current = null;
    setCashierPaymentMethod("");
    setOrderType(order.type);
    setOrderModalVisible(true);

    // Consultamos si ya hubo pagos previos sobre este pedido (ej. un
    // intento anterior que sí se completó) para no volver a cobrar el
    // total completo y que el backend rechace con "monto excede lo
    // pendiente por cobrar".
    setRemainingBalance(null);
    setLoadingBalance(true);
    try {
      const existingPayments = await paymentService.getByOrder(
        Number(order.id),
      );
      const alreadyPaid = existingPayments
        .filter((p) => p.status === "Completed")
        .reduce((sum, p) => sum + p.amount, 0);
      setRemainingBalance(order.total - alreadyPaid);
    } catch {
      // Si falla la consulta, asumimos el total completo como respaldo
      // (comportamiento anterior) — el backend igual validará al cobrar.
      setRemainingBalance(order.total);
    } finally {
      setLoadingBalance(false);
    }
  };



  const handleSelectMenuItem = async (item: Product, quantity: number = 1) => {
    if (!selectedOrder || addingExtra) return;
    setAddingExtra(true);
    try {
      // Se manda como un LOTE NUEVO al mismo pedido (mismo endpoint que usa
      // el Mesero para agregar productos), no se mezcla a mano en el texto
      // local — así cocina lo recibe como algo aparte de lo que ya tenía en
      // marcha, y el backend queda como la única fuente de verdad.
      await orderService.addDetails(Number(selectedOrder.id), [
        {
          productId: item.id,
          quantity,
          notes: null,
          isToGo: extraItemForTakeaway,
        },
      ]);

      // Releemos el pedido real para reflejar el total y los items
      // correctos — antes se sumaba el precio "a mano" en el frontend, lo
      // cual nunca llegaba a cocina ni sobrevivía al próximo refresco.
      const fresh = await orderService.getById(Number(selectedOrder.id));
      const itemsText = fresh.orderDetails
        .map((d) => {
          let base = `${d.quantity}x ${d.productName}`;
          if (d.isToGo) base += " 🛍️ (Para llevar)";
          return d.notes ? `${base} (Nota: ${d.notes})` : base;
        })
        .join("\n");

      const updatedOrder: Order = {
        ...selectedOrder,
        items: itemsText,
        total: fresh.total,
      };
      setSelectedOrder(updatedOrder);
      setOrders((prev: Order[]) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );

      // El saldo pendiente por cobrar sube en la misma cantidad, sin tener
      // que volver a consultar todos los pagos ya hechos.
      setRemainingBalance((prev) =>
        prev === null ? fresh.total : prev + item.price * quantity,
      );

      setCatalogModalVisible(false);
      setSearchQuery("");
      setExtraItemForTakeaway(false);
      showToast(
        t.toastItemAdded.replace("{item}", `${quantity}x ${item.name}`),
      );
    } catch (err: any) {
      Alert.alert(
        "Error",
        err?.message ?? "No se pudo agregar el producto al pedido.",
      );
    } finally {
      setAddingExtra(false);
      setPendingProduct(null);
    }
  };

  const confirmOrderPayment = () => {
    if (!cashierPaymentMethod)
      return Alert.alert(t.alertMissingPayment, t.alertSelectPayment);
    if (cashierPaymentMethod === "wompi") return startWompiQr();
    processPaymentAndCloseMesa();
  };

  const PAYMENT_METHOD_MAP = {
    efectivo: PaymentMethod.Cash,
    datafono: PaymentMethod.Card,
  } as const;

  const processPaymentAndCloseMesa = async () => {
    if (
      !selectedOrder ||
      !cashierPaymentMethod ||
      cashierPaymentMethod === "wompi"
    )
      return;

    const amountToCharge = remainingBalance ?? selectedOrder.total;
    if (amountToCharge <= 0) {
      Alert.alert("Aviso", "Este pedido ya está pagado en su totalidad.");
      return;
    }

    setIsSubmittingPayment(true);
    try {
      // Registro real en el backend — usa el SALDO REAL pendiente, no el
      // total completo del pedido, por si ya hubo un pago parcial/previo.
      const payment = await paymentService.create({
        orderId: Number(selectedOrder.id),
        method: PAYMENT_METHOD_MAP[cashierPaymentMethod],
        amount: amountToCharge,
      });

      // El backend ya libera la mesa automáticamente si con este pago el
      // pedido quedó 100% pagado (ReleaseTableIfFullyPaidAsync) — no hace
      // falta hacer nada más aquí para eso.

      // Facturación automática. El pago YA quedó registrado arriba, así
      // que un fallo aquí no debe deshacer el cobro ni bloquear al cajero
      // — se aísla en su propio try/catch y solo se avisa aparte.
      try {
        await invoiceService.create({ paymentId: payment.id });
      } catch (invoiceErr: any) {
        showToast(
          `⚠️ Pago registrado, pero no se pudo generar la factura (${invoiceErr?.message ?? "error desconocido"}).`,
        );
      }

      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      markAsPaid(selectedOrder.id);
      // ⚠️ paidHistory sigue siendo local por ahora — se reemplaza por datos
      // reales de GET /api/Payments en el paso 3 (cierre de caja real).
      setPaidHistory((prev: Order[]) => [
        ...prev,
        {
          ...selectedOrder,
          status: "pagado",
          paymentMethod: cashierPaymentMethod as any,
          type: orderType,
        },
      ]);
      setOrderModalVisible(false);

      const translatedMethod =
        cashierPaymentMethod === "efectivo" ? t.payCash : t.payCard;
      showToast(
        `✅ ${t.toastPaymentSuccess.replace("{method}", translatedMethod.toUpperCase())}`,
      );

      if (printReceipt) {
        setTimeout(() => showToast(t.toastPrinting), 1000);
      }

      setSelectedOrder(null);
      setCashierPaymentMethod("");
    } catch (err: any) {
      Alert.alert(
        "Error al registrar el pago",
        err?.message ?? "No se pudo registrar el pago. Intenta de nuevo.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // ===== COBRO POR QR / WOMPI =====
  const closeOrderModal = () => {
    stopPolling();
    setWompiQrUrl(null);
    setOrderModalVisible(false);
  };

  const cancelWompiQr = () => {
    stopPolling();
    setWompiQrUrl(null);
    wompiPaymentIdRef.current = null;
  };

  const finishWompiPaid = async (order: Order, paymentId: number) => {
    // Facturación automática: si falla, el pago ya quedó confirmado por Wompi
    try {
      await invoiceService.create({ paymentId });
    } catch (invoiceErr: any) {
      showToast(
        `⚠️ Pago confirmado, pero no se pudo generar la factura (${invoiceErr?.message ?? "error desconocido"}).`,
      );
    }

    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    markAsPaid(order.id);
    setPaidHistory((prev: Order[]) => [
      ...prev,
      {
        ...order,
        status: "pagado",
        paymentMethod: "wompi" as any,
        type: orderType,
      },
    ]);
    setWompiQrUrl(null);
    wompiPaymentIdRef.current = null;
    setOrderModalVisible(false);
    setSelectedOrder(null);
    setCashierPaymentMethod("");
    showToast("✅ Pago confirmado por Wompi");
  };

  const watchWompiPayment = (paymentId: number, order: Order) => {
    startPolling(paymentId, (finalStatus) => {
      if (finalStatus === PaymentStatus.Completed) {
        finishWompiPaid(order, paymentId);
      } else {
        setWompiQrUrl(null);
        Alert.alert(
          "Pago rechazado",
          "Wompi no aprobó el pago. Puedes generar otro QR o cobrar por otro método.",
        );
      }
    });
  };

  const startWompiQr = async () => {
    if (!selectedOrder) return;
    setIsSubmittingPayment(true);
    try {
      const data = await paymentService.initWompiCashier({
        orderId: Number(selectedOrder.id),
      });
      wompiPaymentIdRef.current = data.paymentId;
      setWompiQrAmount(data.amountInCents / 100);
      setWompiQrUrl(buildWompiCheckoutUrl(data));
      watchWompiPayment(data.paymentId, selectedOrder);
    } catch (err: any) {
      Alert.alert(
        "No se pudo generar el QR",
        err?.message ?? "Intenta de nuevo.",
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  const renderOrder = ({ item }: { item: Order }) => {
    if (item.status === "pagado") return null;
    const isMesa = item.type === "mesa";

    const orderTitle = isMesa
      ? t.orderTable.replace("{table}", String(item.table || ""))
      : t.orderTakeaway;

    return (
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card },
          isMesa ? styles.cardMesa : styles.cardLlevar,
        ]}
      >
        <View style={styles.cardHeader}>
          <Text style={[styles.orderId, { color: colors.muted }]}>
            {item.id} • {item.time}
          </Text>
          <Text style={[styles.orderTotal, { color: colors.text }]}>
            ${item.total.toLocaleString("es-CO")}
          </Text>
        </View>
        <Text style={[styles.orderTitle, { color: colors.text }]}>
          {orderTitle}
          {!isMesa && item.customerName ? ` — ${item.customerName}` : ""}
        </Text>
        {!!item.employeeName && (
          <Text
            style={{
              fontSize: 11,
              color: colors.muted,
              marginTop: -4,
              marginBottom: 4,
            }}
          >
            Tomado por: {item.employeeName}
          </Text>
        )}

        <View style={{ marginBottom: 4 }}>
          {item.items
            .split("\n")
            .filter(Boolean)
            .slice(0, 4)
            .map((line: string, idx: number) => (
              <Text
                key={idx}
                style={[styles.orderItemsPreview, { color: colors.muted }]}
                numberOfLines={1}
              >
                • {line}
              </Text>
            ))}
          {(() => {
            const totalLines = item.items.split("\n").filter(Boolean).length;
            const remaining = totalLines - 4;
            if (remaining <= 0) return null;
            return (
              <Text
                style={[
                  styles.orderItemsPreview,
                  { color: colors.muted, fontStyle: "italic" },
                ]}
              >
                + {remaining} producto{remaining > 1 ? "s" : ""} más
              </Text>
            );
          })()}
        </View>
        <TouchableOpacity
          style={styles.payButton}
          onPress={() => openPaymentModal(item)}
        >
          <Text style={styles.payButtonText}>{t.btnCharge}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const displayData = orders.filter(
    (o: Order) => o.type === filterType && o.status !== "pagado",
  );
  const emptyText = filterType === "mesa" ? t.emptyTables : t.emptyOthers;

  return (
    <View style={styles.content}>
      <FlatList
        data={displayData}
        keyExtractor={(item) => item.id}
        renderItem={renderOrder}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.muted }]}>
            {emptyText}
          </Text>
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={orderModalVisible}
        onRequestClose={closeOrderModal}
      >
        <View style={styles.modalOverlay}>
          {/* 🔥 MODAL DE COBRO DINÁMICO 🔥 */}
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.modalChargeOrder}
              </Text>
              <TouchableOpacity onPress={closeOrderModal}>
                <Text style={[styles.closeIcon, { color: colors.muted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            {selectedOrder && (
              <View
                style={[
                  styles.ticketContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                  },
                ]}
              >

                    <View style={styles.ticketRow}>
                      <Text
                        style={[styles.ticketLabel, { color: colors.muted }]}
                      >
                        {t.orderTypeLabel}
                      </Text>
                      <Text style={styles.ticketValueLarge}>
                        {selectedOrder.type === "mesa"
                          ? t.orderTable.replace(
                              "{table}",
                              String(selectedOrder.table || ""),
                            )
                          : t.catalogTakeaway}
                      </Text>
                    </View>
                    {selectedOrder.type !== "mesa" &&
                      selectedOrder.customerName && (
                        <View style={styles.ticketRow}>
                          <Text
                            style={[
                              styles.ticketLabel,
                              { color: colors.muted },
                            ]}
                          >
                            Cliente:
                          </Text>
                          <Text
                            style={[styles.ticketValue, { color: colors.text }]}
                          >
                            {selectedOrder.customerName}
                          </Text>
                        </View>
                      )}
                    {!!selectedOrder.employeeName && (
                      <View style={styles.ticketRow}>
                        <Text
                          style={[styles.ticketLabel, { color: colors.muted }]}
                        >
                          Atendido por:
                        </Text>
                        <Text
                          style={[styles.ticketValue, { color: colors.text }]}
                        >
                          {selectedOrder.employeeName}
                        </Text>
                      </View>
                    )}
                    <View style={styles.ticketRow}>
                      <Text
                        style={[styles.ticketLabel, { color: colors.muted }]}
                      >
                        {t.orderTimeLabel}
                      </Text>
                      <Text
                        style={[styles.ticketValue, { color: colors.text }]}
                      >
                        {selectedOrder.time}
                      </Text>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <Text
                      style={[
                        styles.ticketItemsHeader,
                        { color: colors.muted },
                      ]}
                    >
                      {t.consumptionDetail}
                    </Text>
                    <ScrollView style={styles.itemsScroll}>
                      <Text
                        style={[styles.ticketItemsList, { color: colors.text }]}
                      >
                        {selectedOrder.items}
                      </Text>
                    </ScrollView>

                    <View
                      style={{ flexDirection: "row", gap: 10, marginTop: 10 }}
                    >
                      <TouchableOpacity
                        style={[
                          styles.addMissingBtn,
                          {
                            flex: 1,
                            borderColor: "#3B82F6",
                            backgroundColor: isDark ? "#1e3a8a" : "#EFF6FF",
                          },
                        ]}
                        onPress={() => setCatalogModalVisible(true)}
                      >
                        <Ionicons
                          name="add-circle"
                          size={16}
                          color="#3B82F6"
                          style={{ marginRight: 5 }}
                        />
                        <Text style={styles.addMissingBtnText}>
                          {t.btnAddExtra}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.addMissingBtn,
                          {
                            flex: 1,
                            borderColor: printReceipt
                              ? "#10B981"
                              : colors.border,
                            backgroundColor: isDark ? "transparent" : "#FFFFFF",
                          },
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setPrintReceipt(!printReceipt);
                        }}
                      >
                        <Ionicons
                          name={printReceipt ? "print" : "print-outline"}
                          size={16}
                          color={printReceipt ? "#10B981" : colors.muted}
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.addMissingBtnText,
                            { color: printReceipt ? "#10B981" : colors.muted },
                          ]}
                        >
                          {printReceipt ? t.btnReceiptYes : t.btnReceiptAsk}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    <View
                      style={[
                        styles.divider,
                        { backgroundColor: colors.border },
                      ]}
                    />

                    <View style={styles.totalRow}>
                      <Text style={[styles.totalLabel, { color: colors.text }]}>
                        {t.totalToCharge}
                      </Text>
                      <Text style={styles.totalValue}>
                        {loadingBalance
                          ? "Calculando..."
                          : `$${(remainingBalance ?? selectedOrder.total).toLocaleString("es-CO")}`}
                      </Text>
                    </View>

                    <Text
                      style={[
                        styles.paymentMethodTitle,
                        { color: colors.muted },
                      ]}
                    >
                      {t.howDidClientPay}
                    </Text>

                    <View style={styles.paymentOptionsRow}>
                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "efectivo" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("efectivo");
                        }}
                      >
                        <Ionicons
                          name="cash"
                          size={20}
                          color={
                            cashierPaymentMethod === "efectivo"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "efectivo" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          {t.payCash}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "datafono" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("datafono");
                        }}
                      >
                        <Ionicons
                          name="card"
                          size={20}
                          color={
                            cashierPaymentMethod === "datafono"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "datafono" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          {t.payCard}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[
                          styles.paymentMethodBtn,
                          {
                            backgroundColor: colors.card,
                            borderColor: colors.border,
                          },
                          cashierPaymentMethod === "wompi" &&
                            styles.paymentMethodBtnActive,
                        ]}
                        disabled={!!wompiQrUrl}
                        onPress={() => {
                          LayoutAnimation.configureNext(
                            LayoutAnimation.Presets.easeInEaseOut,
                          );
                          setCashierPaymentMethod("wompi");
                        }}
                      >
                        <Ionicons
                          name="qr-code"
                          size={20}
                          color={
                            cashierPaymentMethod === "wompi"
                              ? "#E61C24"
                              : colors.muted
                          }
                        />
                        <Text
                          style={[
                            styles.paymentMethodText,
                            { color: colors.muted },
                            cashierPaymentMethod === "wompi" &&
                              styles.paymentMethodTextActive,
                          ]}
                        >
                          QR / Wompi
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {cashierPaymentMethod === "wompi" && (
                      <View
                        style={{
                          alignItems: "center",
                          marginTop: 12,
                          padding: 14,
                          borderRadius: 12,
                          borderWidth: 1,
                          borderColor: colors.border,
                          backgroundColor: colors.card,
                        }}
                      >
                        {wompiQrUrl ? (
                          <>
                            <View
                              style={{
                                backgroundColor: "#FFFFFF",
                                padding: 12,
                                borderRadius: 8,
                              }}
                            >
                              <QRCode value={wompiQrUrl} size={220} />
                            </View>
                            <Text
                              style={{
                                color: colors.text,
                                fontWeight: "700",
                                marginTop: 10,
                              }}
                            >
                              Monto: ${wompiQrAmount.toLocaleString("es-CO")}
                            </Text>
                            <Text
                              style={{
                                color: colors.muted,
                                marginTop: 4,
                                fontSize: 12,
                                textAlign: "center",
                              }}
                            >
                              Escanear con la cámara del celular, no con la app
                              del banco.
                            </Text>
                            <TouchableOpacity
                              style={{ marginTop: 6, padding: 6 }}
                              onPress={() => Linking.openURL(wompiQrUrl)}
                            >
                              <Text style={{ color: "#3B82F6", fontWeight: "600" }}>
                                Abrir enlace de pago (prueba)
                              </Text>
                            </TouchableOpacity>
                            {polling ? (
                              <View style={{ alignItems: "center", marginTop: 8 }}>
                                <ActivityIndicator size="small" color="#E61C24" />
                                <Text style={{ color: colors.muted, marginTop: 6 }}>
                                  Esperando que el cliente pague...
                                </Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={{ marginTop: 8, padding: 8 }}
                                onPress={() =>
                                  selectedOrder &&
                                  wompiPaymentIdRef.current &&
                                  watchWompiPayment(
                                    wompiPaymentIdRef.current,
                                    selectedOrder,
                                  )
                                }
                              >
                                <Text style={{ color: "#E61C24", fontWeight: "600" }}>
                                  Tiempo agotado. Toca para verificar de nuevo
                                </Text>
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity
                              style={{ marginTop: 6, padding: 8 }}
                              onPress={cancelWompiQr}
                            >
                              <Text style={{ color: colors.muted }}>
                                Cancelar cobro por QR
                              </Text>
                            </TouchableOpacity>
                          </>
                        ) : (
                          <Text style={{ color: colors.muted, textAlign: "center" }}>
                            Se generará un QR con el monto. El cliente debe
                            escanearlo con la CÁMARA de su celular (no con la
                            app del banco ni de Nequi). Se abrirá la página de
                            Wompi y ahí paga con Nequi, tarjeta o PSE. Aquí
                            verás la confirmación.
                          </Text>
                        )}
                      </View>
                    )}

                    {cashierPaymentMethod === "datafono" && (
                      <View
                        style={[
                          styles.warningBox,
                          {
                            backgroundColor: isDark ? "#064e3b" : "#d1fae5",
                            borderColor: isDark ? "#065f46" : "#a7f3d0",
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={16}
                          color="#10B981"
                          style={{ marginRight: 5 }}
                        />
                        <Text
                          style={[
                            styles.warningText,
                            { color: isDark ? "#34d399" : "#065F46" },
                          ]}
                        >
                          {t.warningCard}
                        </Text>
                      </View>
                    )}
              </View>
            )}

            {selectedOrder?.status === "pagando_transferencia" ? (
              <View style={styles.validationButtonsRow}>
                <TouchableOpacity
                  style={styles.btnReject}
                  onPress={() => handleValidateTransfer(false)}
                >
                  <Text style={styles.modalAcceptText}>{t.btnReject}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnApprove}
                  onPress={() => handleValidateTransfer(true)}
                >
                  <Text style={styles.modalAcceptText}>
                    {t.btnApproveTransfer}
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={[
                  styles.modalAcceptBtn,
                  (!cashierPaymentMethod ||
                    isSubmittingPayment ||
                    loadingBalance ||
                    !!wompiQrUrl) && {
                    backgroundColor: isDark ? "#475569" : "#FDA4AF",
                  },
                ]}
                onPress={confirmOrderPayment}
                disabled={
                  !cashierPaymentMethod ||
                  isSubmittingPayment ||
                  loadingBalance ||
                  !!wompiQrUrl
                }
              >
                <Text style={styles.modalAcceptText}>
                  {isSubmittingPayment
                    ? "Registrando pago..."
                    : cashierPaymentMethod === "wompi"
                      ? wompiQrUrl
                        ? "Esperando pago del cliente..."
                        : "Generar QR de cobro"
                      : cashierPaymentMethod
                        ? t.btnConfirmAndClose
                        : t.btnSelectMethod}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Modal>

      {/* 🔥 MODAL DE CATÁLOGO (AGREGAR EXTRA) DINÁMICO 🔥 */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={catalogModalVisible}
        onRequestClose={() =>
          pendingProduct
            ? setPendingProduct(null)
            : setCatalogModalVisible(false)
        }
      >
        <View style={styles.catalogOverlay}>
          <View style={[styles.catalogBox, { backgroundColor: colors.card }]}>
            <View style={styles.catalogHeader}>
              <Text style={[styles.catalogTitle, { color: colors.text }]}>
                {t.catalogTitle}
              </Text>
              <TouchableOpacity onPress={() => setCatalogModalVisible(false)}>
                <Text style={[styles.closeIcon, { color: colors.muted }]}>
                  ✕
                </Text>
              </TouchableOpacity>
            </View>

            <Text
              style={[
                styles.warningText,
                { color: colors.muted, marginBottom: 10 },
              ]}
            >
              {t.catalogExtraQuestion}
            </Text>

            <View style={{ flexDirection: "row", gap: 10, marginBottom: 14 }}>
              <TouchableOpacity
                style={[
                  styles.addMissingBtn,
                  {
                    flex: 1,
                    marginTop: 0,
                    borderColor: !extraItemForTakeaway
                      ? "#10B981"
                      : colors.border,
                    backgroundColor: isDark ? "transparent" : "#FFFFFF",
                  },
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExtraItemForTakeaway(false);
                }}
              >
                <Ionicons
                  name="restaurant"
                  size={16}
                  color={!extraItemForTakeaway ? "#10B981" : colors.muted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.addMissingBtnText,
                    { color: !extraItemForTakeaway ? "#10B981" : colors.muted },
                  ]}
                >
                  {t.catalogTable}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.addMissingBtn,
                  {
                    flex: 1,
                    marginTop: 0,
                    borderColor: extraItemForTakeaway
                      ? "#10B981"
                      : colors.border,
                    backgroundColor: isDark ? "transparent" : "#FFFFFF",
                  },
                ]}
                onPress={() => {
                  LayoutAnimation.configureNext(
                    LayoutAnimation.Presets.easeInEaseOut,
                  );
                  setExtraItemForTakeaway(true);
                }}
              >
                <Ionicons
                  name="bag-outline"
                  size={16}
                  color={extraItemForTakeaway ? "#10B981" : colors.muted}
                  style={{ marginRight: 5 }}
                />
                <Text
                  style={[
                    styles.addMissingBtnText,
                    { color: extraItemForTakeaway ? "#10B981" : colors.muted },
                  ]}
                >
                  {t.catalogTakeaway}
                </Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.searchContainer,
                { backgroundColor: colors.inputBg },
              ]}
            >
              <Ionicons name="search" size={20} color={colors.muted} />
              <TextInput
                style={[styles.searchInput, { color: colors.text }]}
                placeholder={t.catalogSearchPlaceholder}
                placeholderTextColor={colors.muted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoFocus={true}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery("")}>
                  <Ionicons
                    name="close-circle"
                    size={20}
                    color={colors.muted}
                  />
                </TouchableOpacity>
              )}
            </View>

            {productsLoading ? (
              <View style={{ paddingVertical: 30, alignItems: "center" }}>
                <ActivityIndicator color={colors.muted} />
              </View>
            ) : productsError ? (
              <Text style={[styles.emptyCatalogText, { color: colors.muted }]}>
                {productsError}
              </Text>
            ) : (
              <FlatList
                data={filteredMenu}
                keyExtractor={(item) => String(item.id)}
                contentContainerStyle={{ paddingBottom: 20 }}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.catalogItem,
                      { borderBottomColor: colors.border },
                    ]}
                    onPress={() => openAddConfirmation(item)}
                    disabled={addingExtra}
                  >
                    <View>
                      <Text
                        style={[styles.catalogItemName, { color: colors.text }]}
                      >
                        {item.name}
                      </Text>
                      <Text style={styles.catalogItemPrice}>
                        + ${item.price.toLocaleString("es-CO")}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.catalogAddBtn,
                        { backgroundColor: isDark ? "#451a03" : "#FEF2F2" },
                      ]}
                    >
                      <Text style={styles.catalogAddBtnText}>
                        {addingExtra ? "..." : t.catalogBtnAdd}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ListEmptyComponent={
                  <Text
                    style={[styles.emptyCatalogText, { color: colors.muted }]}
                  >
                    {t.catalogEmptySearch.replace("{query}", searchQuery)}
                  </Text>
                }
              />
            )}
          </View>

          {/* CONFIRMACIÓN AL AÑADIR (overlay dentro del mismo Modal) */}
          {pendingProduct && (
            <View style={styles.confirmOverlay}>
              <View
                style={[
                  styles.confirmBox,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.confirmIconWrap}>
                  <Ionicons name="cart" size={28} color="#EA1D2C" />
                </View>

                <Text style={[styles.confirmTitle, { color: colors.text }]}>
                  {t.confirmAddTitle}
                </Text>
                <Text
                  style={[styles.confirmProductName, { color: colors.text }]}
                  numberOfLines={2}
                >
                  {pendingProduct.name}
                </Text>
                <Text style={styles.confirmUnitPrice}>
                  ${pendingProduct.price.toLocaleString("es-CO")}
                </Text>

                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmLabel, { color: colors.muted }]}>
                    {t.confirmAddQuantity}
                  </Text>
                  <View style={styles.confirmStepper}>
                    <TouchableOpacity
                      style={[
                        styles.confirmStepBtn,
                        { borderColor: colors.border },
                      ]}
                      disabled={pendingQuantity <= 1 || addingExtra}
                      onPress={() =>
                        setPendingQuantity((q) => Math.max(1, q - 1))
                      }
                    >
                      <Ionicons name="remove" size={20} color={colors.text} />
                    </TouchableOpacity>
                    <Text style={[styles.confirmQty, { color: colors.text }]}>
                      {pendingQuantity}
                    </Text>
                    <TouchableOpacity
                      style={[
                        styles.confirmStepBtn,
                        { borderColor: colors.border },
                      ]}
                      disabled={pendingQuantity >= 99 || addingExtra}
                      onPress={() =>
                        setPendingQuantity((q) => Math.min(99, q + 1))
                      }
                    >
                      <Ionicons name="add" size={20} color={colors.text} />
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.confirmRow}>
                  <Text style={[styles.confirmLabel, { color: colors.muted }]}>
                    {extraItemForTakeaway ? t.catalogTakeaway : t.catalogTable}
                  </Text>
                  <Text style={styles.confirmTotal}>
                    $
                    {(pendingProduct.price * pendingQuantity).toLocaleString(
                      "es-CO",
                    )}
                  </Text>
                </View>

                <View style={styles.confirmButtonsRow}>
                  <TouchableOpacity
                    style={[
                      styles.confirmCancelBtn,
                      { borderColor: colors.border },
                    ]}
                    disabled={addingExtra}
                    onPress={() => setPendingProduct(null)}
                  >
                    <Text
                      style={[styles.confirmCancelText, { color: colors.text }]}
                    >
                      {t.btnCancel}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.confirmOkBtn,
                      addingExtra && { opacity: 0.6 },
                    ]}
                    disabled={addingExtra}
                    onPress={() =>
                      handleSelectMenuItem(pendingProduct, pendingQuantity)
                    }
                  >
                    <Text style={styles.confirmOkText}>
                      {addingExtra ? t.confirmAddAdding : t.confirmAddBtn}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </Modal>
    </View>
  );
};

import { useCallback, useMemo, useRef, useState } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import { Alert, LayoutAnimation, useWindowDimensions } from "react-native";
import { Order } from "./CashierData";
import { TRANSLATIONS, LanguageCode } from "./../../../locales/CashierTranslations";
import { paymentService } from "@/features/payments/services/paymentService";
import { PaymentMethod, PaymentStatus } from "@/features/payments/types/payment.types";
import { useWompiPolling } from "@/features/payments/hooks/useWompiPolling";
import { buildWompiCheckoutUrl } from "@/features/payments/utils/wompiUrl";
import { invoiceService } from "@/features/invoices/services/invoiceService";
import { orderService } from "@/features/orders/services/orderService";
import { useProducts } from "@/features/products/hooks/useProducts";
import type { Product } from "@/features/products/types/product.types";
import { localizeMobileCatalogText } from "../../../locales/mobileCopy";

export function useCashierOrdersModel({ orders, setOrders, markAsPaid, setPaidHistory, showToast, filterType, setActiveTab, lang = "es", isDark = false, }: any){
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const t = TRANSLATIONS[lang as LanguageCode] || TRANSLATIONS["es"];
  const catalogLanguage = lang as LanguageCode;
  const localizedProductName = useCallback((item: Product) =>
    localizeMobileCatalogText(
      item.name,
      { en: item.nameEn, pt: item.namePt, fr: item.nameFr },
      catalogLanguage,
    ), [catalogLanguage]);

  // 🔥 PALETA DE COLORES DINÁMICA COMPLETA PARA EL CAJERO 🔥
  const colors = {
    background: isDark ? "#0B1220" : "#F8FAFC",
    card: isDark ? "#111827" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#CBD5E1" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    inputBg: isDark ? "#1F2937" : "#F1F5F9",
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
  const [showAllOrders, setShowAllOrders] = useRememberedUiState<boolean>("cashier:all-orders", false);
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);
  // Saldo real pendiente (total del pedido menos lo ya pagado antes).
  // null mientras se consulta; evita cobrar el total completo si el
  // pedido ya tuvo un pago parcial/previo registrado en el backend.
  const [remainingBalance, setRemainingBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Mantener el filtro al volver; no reabrir ningún modal de cobro.

  // Catálogo REAL del backend (antes era MENU_ITEMS, una lista inventada
  // sin relación con los productos reales — por eso "Agregar extra" nunca
  // llegaba a cocina: mandaba un productId que no existía).
  const {
    products,
    loading: productsLoading,
    error: productsError,
  } = useProducts();

  const filteredMenu = useMemo(() => {
    const query = searchQuery.toLocaleLowerCase();
    return products.filter((item) =>
      [item.name, localizedProductName(item)]
        .some((name) => name.toLocaleLowerCase().includes(query)),
    );
  }, [products, searchQuery, localizedProductName]);

  const openPaymentModal = async (order: Order) => {
    setSelectedOrder(order);
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
        subTotal: fresh.subTotal,
        tax: fresh.tax,
        taxRate: fresh.taxRate,
        taxIncludedInPrice: fresh.taxIncludedInPrice,
        deliveryFee: fresh.deliveryFee,
      };
      setSelectedOrder(updatedOrder);
      setOrders((prev: Order[]) =>
        prev.map((o) => (o.id === updatedOrder.id ? updatedOrder : o)),
      );

      // El saldo pendiente por cobrar sube en la misma cantidad, sin tener
      // que volver a consultar todos los pagos ya hechos.
      setRemainingBalance((prev) =>
        prev === null ? fresh.total : prev + (fresh.total - selectedOrder.total),
      );

      setCatalogModalVisible(false);
      setSearchQuery("");
      setExtraItemForTakeaway(false);
      showToast(
        t.toastItemAdded.replace("{item}", `${quantity}x ${localizedProductName(item)}`),
      );
    } catch (err: any) {
      Alert.alert(
        t.errorTitle,
        err?.message ?? t.extraProductAddError,
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

  const createInvoiceForPaidPayment = (
    paymentId: number,
    failureMessage: string,
  ) => {
    void invoiceService.create({ paymentId }).catch((invoiceErr: unknown) => {
      const message = invoiceErr instanceof Error ? invoiceErr.message : "";
      showToast(failureMessage.replace("{error}", message));
    });
  };

  const processPaymentAndCloseMesa = async () => {
    if (
      !selectedOrder ||
      !cashierPaymentMethod ||
      cashierPaymentMethod === "wompi"
    )
      return;

    const amountToCharge = remainingBalance ?? selectedOrder.total;
    if (amountToCharge <= 0) {
      Alert.alert(t.warningTitle, t.orderAlreadyPaid);
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

      // El pago quedó guardado. La factura puede imprimirse luego desde Pagados.
      createInvoiceForPaidPayment(
        payment.id,
        t.invoiceFailedAfterPayment,
      );

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

      setSelectedOrder(null);
      setCashierPaymentMethod("");
    } catch (err: any) {
      Alert.alert(
        t.paymentErrorTitle,
        err?.message ?? t.paymentCreateError,
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
    setSelectedOrder(null);
  };

  const cancelWompiQr = () => {
    stopPolling();
    setWompiQrUrl(null);
    wompiPaymentIdRef.current = null;
  };

  const finishWompiPaid = async (order: Order, paymentId: number) => {
    // Wompi ya confirmó el pago; no esperamos a que el cajero cierre el PDF.
    createInvoiceForPaidPayment(
      paymentId,
      t.invoiceFailedAfterWompi,
    );

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
    showToast(t.wompiPaidToast);
  };

  const watchWompiPayment = (paymentId: number, order: Order) => {
    startPolling(paymentId, (finalStatus) => {
      if (finalStatus === PaymentStatus.Completed) {
        finishWompiPaid(order, paymentId);
      } else {
        setWompiQrUrl(null);
        Alert.alert(
          t.wompiRejectedTitle,
          t.wompiRejectedMessage,
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
        t.wompiQrErrorTitle,
        err?.message ?? t.tryAgain,
      );
    } finally {
      setIsSubmittingPayment(false);
    }
  };

return { orders, setOrders, markAsPaid, setPaidHistory, showToast, filterType, setActiveTab, lang, isDark, screenWidth, screenHeight, t, catalogLanguage, localizedProductName, colors, orderModalVisible, setOrderModalVisible, selectedOrder, setSelectedOrder, cashierPaymentMethod, setCashierPaymentMethod, startPolling, stopPolling, polling, wompiQrUrl, setWompiQrUrl, wompiQrAmount, setWompiQrAmount, wompiPaymentIdRef, catalogModalVisible, setCatalogModalVisible, searchQuery, setSearchQuery, extraItemForTakeaway, setExtraItemForTakeaway, addingExtra, setAddingExtra, pendingProduct, setPendingProduct, pendingQuantity, setPendingQuantity, openAddConfirmation, orderType, setOrderType, showAllOrders, setShowAllOrders, isSubmittingPayment, setIsSubmittingPayment, remainingBalance, setRemainingBalance, loadingBalance, setLoadingBalance, products, productsLoading, productsError, filteredMenu, openPaymentModal, handleSelectMenuItem, confirmOrderPayment, PAYMENT_METHOD_MAP, createInvoiceForPaidPayment, processPaymentAndCloseMesa, closeOrderModal, cancelWompiQr, finishWompiPaid, watchWompiPayment, startWompiQr };
}
export type CashierOrdersModel=ReturnType<typeof useCashierOrdersModel>;

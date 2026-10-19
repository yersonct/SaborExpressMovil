import React, { useState, useRef, useEffect, useCallback } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Animated,
  Platform,
  LayoutAnimation,
  Modal,
  ScrollView,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { styles } from "../style/CashierStyles";
import { useCashierContext } from "../context/CashierContext";

import { STAFF_TODAY, Employee, Order } from "./CashierData";
import { OrdersFeature } from "./OrdersFeature";
import { DeliveryOrdersPanel } from "./DeliveryOrdersPanel";
import { PaidOrdersPanel } from "./PaidOrdersPanel";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { useCashierOrders } from "../hooks/useCashierOrders";
import { useTables } from "@/features/tables/hooks/useTables";
import { type TableReleaseReview } from "@/features/tables/types/table.types";
import { tableService } from "@/features/tables/services/tableService";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { useCashierNotifications } from "../hooks/useCashierNotifications";
import { cashClosureService, type CashClosurePreview } from "@/features/payments/services/cashClosureService";
import { useAuth } from "@/features/auth/context/AuthContext";
import { orderService, OrderStatus, OrderType } from "@/features/orders";
import { isReadyForCashier } from "./DeliveryOrdersPanel";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { getColombiaDayKey } from "@/features/shared/utils/colombia-date";

import {
  TRANSLATIONS,
  LanguageCode,
} from "./../../../locales/CashierTranslations";

export default function CashierDashboard() {
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isNarrowScreen = screenWidth < 390;
  const navigation = useNavigation();
  const {
    language,
    isDark,
    notificationSound,
    vibrationNotifications,
    autoPrint,
  } = useCashierContext();
  const { profile: cashierProfile } = useMyProfile();
  const { handleLogout } = useAuth();
  const cashierName = [cashierProfile?.name, cashierProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];

  // 🔥 PALETA GLOBAL DE COLORES
  const colors = {
    background: isDark ? "#0B1220" : "#F8FAFC",
    card: isDark ? "#111827" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#CBD5E1" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    buttonDark: isDark ? "#334155" : "#1E293B",
  };

  const [activeTab, setActiveTab] = useRememberedUiState<
    "mesa" | "llevar" | "delivery" | "pagados" | "personal"
  >("cashier:tab", "mesa", (v): v is "mesa" | "llevar" | "delivery" | "pagados" | "personal" =>
    typeof v === "string" && ["mesa", "llevar", "delivery", "pagados", "personal"].includes(v));
  const { branchId } = useMyBranch();
  const [showOlderOrders, setShowOlderOrders] = useRememberedUiState<boolean>("cashier:older", false);
  const [todayKey, setTodayKey] = useState(() => getColombiaDayKey());
  useEffect(() => {
    const interval = setInterval(() => setTodayKey(getColombiaDayKey()), 60_000);
    return () => clearInterval(interval);
  }, []);
  const belongsToToday = (iso?: string | null) =>
    Boolean(iso) && getColombiaDayKey(iso!) === todayKey;
  const {
    orders,
    setOrders,
    loading: ordersLoading,
    markAsPaid,
    paidOrdersAwaitingDelivery,
    paidOrders,
  } = useCashierOrders(branchId);

  const { refetch: refetchTables } = useTables(branchId);
  const [previousTableReviews, setPreviousTableReviews] = useState<TableReleaseReview[]>([]);
  const [reviewLoading, setReviewLoading] = useState(false);

  const loadPreviousReviews = useCallback(async () => {
    if (!branchId) {
      setPreviousTableReviews([]);
      return;
    }
    try {
      const reviews = await tableService.getPreviousReleaseReviews(branchId);
      setPreviousTableReviews(reviews);
    } catch {
      // El botón no debe ofrecer liberación sin la validación del backend.
      setPreviousTableReviews([]);
    }
  }, [branchId]);

  useEffect(() => { void loadPreviousReviews(); }, [loadPreviousReviews]);
  useRealtimeEvents(["OrdersChanged", "PaymentsChanged", "TablesChanged", "RealtimeConnected"],
    () => { void loadPreviousReviews(); });

  const ordersToday = orders.filter((o) => belongsToToday(o.createdAt));
  const ordersPrevious = orders.filter((o) => !belongsToToday(o.createdAt));
  const ordersOnScreen = showOlderOrders ? ordersPrevious : ordersToday;
  const oldInTab = ordersPrevious.filter((o) => o.type === activeTab).length;
  const tableOrderCount = ordersToday.filter((o) => o.type === "mesa").length +
    paidOrdersAwaitingDelivery.filter((o) => belongsToToday(o.createdAt)).length;
  const paidTodayCount = paidOrders.filter((o) => belongsToToday(o.paidAt ?? o.createdAt)).length;

  const [tableToRelease, setTableToRelease] = useState<TableReleaseReview | null>(null);
  const [releasing, setReleasing] = useState(false);

  const handleReleaseTable = async (review: TableReleaseReview) => {
    setReviewLoading(true);
    try {
      // Revisar otra vez justo antes del diálogo: no confiar en un listado antiguo.
      const current = await tableService.getReleaseReview(review.tableId);
      if (!current.isPreviousDay || !current.canReleaseNormally) {
        showToast("Esta mesa tiene cuentas pendientes o ya cambió su sesión. Consulta al administrador.");
        void loadPreviousReviews();
        return;
      }
      setTableToRelease(current);
    } catch (err: any) {
      showToast(err?.message ?? "No se pudo consultar el estado de la mesa.");
    } finally {
      setReviewLoading(false);
    }
  };

  const confirmReleaseTable = async () => {
    if (!tableToRelease || releasing) return;
    const target = tableToRelease;
    setReleasing(true);
    try {
      await tableService.releasePrevious(target.tableId, {
        expectedSessionId: target.currentSessionId,
        administrative: false,
      });
      setTableToRelease(null);
      showToast(t.tableReleased.replace("{table}", String(target.tableNumber)));
      await Promise.all([refetchTables(true), loadPreviousReviews()]);
    } catch (err: any) {
      showToast(t.releaseTableFailed.replace("{error}", err?.message ?? ""));
    } finally {
      setReleasing(false);
    }
  };

  // Pedidos de domicilio que se ven en la pestaña Delivery (mismo filtro que el panel)
  const [deliveryCount, setDeliveryCount] = useState(0);
  const fetchDeliveryCount = useCallback(async () => {
    if (!branchId) {
      setDeliveryCount(0);
      return;
    }
    try {
      const all = await orderService.getAll(branchId);
      const candidates = all.filter(
        (o) =>
          o.orderType === OrderType.Delivery &&
          o.status === OrderStatus.Pending &&
          o.orderDetails.length > 0 &&
          getColombiaDayKey(o.createdAt) === todayKey,
      );
      // Mismo criterio del panel: efectivo, o Wompi ya aprobado
      const checks = await Promise.all(candidates.map(isReadyForCashier));
      const confirmedDeliveries = all.filter(
        (o) =>
          o.orderType === OrderType.Delivery &&
          (o.status === OrderStatus.Confirmed ||
            o.status === OrderStatus.InPreparation ||
            o.status === OrderStatus.Ready) &&
          getColombiaDayKey(o.createdAt) === todayKey,
      ).length;
      // La pestaña también muestra los domicilios confirmados en el pie.
      setDeliveryCount(checks.filter(Boolean).length + confirmedDeliveries);
    } catch {
      // Silencioso: se reintenta en el siguiente ciclo
    }
  }, [branchId, todayKey]);

  useEffect(() => {
    fetchDeliveryCount();
  }, [fetchDeliveryCount]);

  const [staff, setStaff] = useState<Employee[]>(STAFF_TODAY);
  // ⚠️ Sigue siendo un historial local/de ejemplo — se conecta a pagos reales
  // en el paso de "cierre de caja real" (paso 3 de la lista).
  const [paidHistory, setPaidHistory] = useState<Order[]>([
    {
      id: "ORD-099",
      type: "mesa",
      items: "Base de Caja",
      total: 35000,
      status: "pagado",
      paymentMethod: "efectivo",
      time: "11:00 AM",
    },
  ]);
  const [closeRegisterModal, setCloseRegisterModal] = useState(false);
  const [shiftSummary, setShiftSummary] = useState<CashClosurePreview | null>(null);
  const [loadingShiftSummary, setLoadingShiftSummary] = useState(false);
  const [countedCash, setCountedCash] = useState("");
  const [closureNotes, setClosureNotes] = useState("");
  const [closureError, setClosureError] = useState<string | null>(null);
  const [closingShift, setClosingShift] = useState(false);
  const [confirmClosure, setConfirmClosure] = useState(false);

  const [toastMessage, setToastMessage] = useState("");
  const toastAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (message: string) => {
    setToastMessage(message);
    Animated.sequence([
      Animated.timing(toastAnim, {
        toValue: Platform.OS === "ios" ? 50 : 20,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(3500),
      Animated.timing(toastAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Sube cada vez que llega una notificación, para que el panel de Delivery se recargue.
  const [deliveryRefreshKey, setDeliveryRefreshKey] = useState(0);

  // Refresca los contadores y el panel de domicilios; pedidos y mesas escuchan sus eventos.
  const refreshAll = useCallback(() => {
    fetchDeliveryCount();
    setDeliveryRefreshKey((k) => k + 1);
  }, [fetchDeliveryCount]);

  const { soundEnabled, enableSound } = useCashierNotifications(
    async (n) => {
      if (n.type === "PaymentConfirmed") {
        showToast(n.message);
        return;
      }
      if (n.type !== "OrderCreated") return;

      // Se consulta el pedido para saber en qué pestaña quedó
      let lugar = "";
      if (n.relatedEntityId) {
        try {
          const o = await orderService.getById(n.relatedEntityId);
          lugar =
            o.orderType === OrderType.DineIn
              ? t.locationTable.replace("{table}", String(o.tableNumber ?? ""))
              : o.orderType === OrderType.Delivery
                ? t.tabDelivery
                : t.tabTakeaway;
        } catch {}
      }
      const location = lugar ? t.toastTabSuffix.replace("{tab}", lugar) : "";
      const orderNumber = n.relatedEntityId ? ` #${n.relatedEntityId}` : "";

      showToast(
        t.toastNewOrder
          .replace("{number}", orderNumber)
          .replace("{location}", location),
      );
    },
    notificationSound,
    refreshAll,
    vibrationNotifications,
  );

  const handleOpenCloseRegister = async () => {
    setCloseRegisterModal(true);
    setLoadingShiftSummary(true);
    setShiftSummary(null);
    setCountedCash("");
    setClosureNotes("");
    setClosureError(null);
    setConfirmClosure(false);
    try {
      setShiftSummary(await cashClosureService.preview());
    } catch (error: any) {
      setClosureError(error?.message ?? "No se pudo consultar el turno y sus pagos.");
    } finally {
      setLoadingShiftSummary(false);
    }
  };

  const parsedCash = countedCash.trim() !== "" && /^\d{1,12}$/.test(countedCash)
    ? Number(countedCash)
    : null;
  const difference = parsedCash === null ? null : parsedCash - (shiftSummary?.cashExpected ?? 0);
  const fmtCash = (amount: number) => `$${amount.toLocaleString("es-CO")}`;
  const handleCloseRegister = async () => {
    if (closingShift || !shiftSummary || shiftSummary.isClosed || parsedCash === null) return;
    if (!confirmClosure) {
      setConfirmClosure(true);
      return;
    }
    setClosingShift(true);
    setClosureError(null);
    try {
      const closed = await cashClosureService.close(parsedCash, closureNotes);
      setCloseRegisterModal(false);
      Alert.alert(
        t.cashClosureSuccessTitle,
        t.cashClosureSuccessBody.replace("{difference}", fmtCash(closed.cashDifference)),
        [{ text: t.cashClosureOK, onPress: () => { void handleLogout(); } }],
        { cancelable: false },
      );
    } catch (error: any) {
      setClosureError(error?.message ?? "No se pudo registrar el cierre. No se ha terminado el turno.");
      setConfirmClosure(false);
    } finally {
      setClosingShift(false);
    }
  };

  // Solo ventas registradas por el cajero en ESTE turno, calculadas por backend.
  const totalEfectivo = shiftSummary?.cashExpected ?? 0;
  const totalTransferencia = shiftSummary?.transferTotal ?? 0;
  const totalWompi = shiftSummary?.wompiTotal ?? 0;
  const totalDatafono = shiftSummary?.cardTotal ?? 0;
  const totalGlobal = shiftSummary?.totalSales ?? 0;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <Animated.View
        style={[
          styles.toastContainer,
          { transform: [{ translateY: toastAnim }] },
        ]}
      >
        <Text style={styles.toastText}>{toastMessage}</Text>
      </Animated.View>

      <View
        style={[
          styles.header,
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <View
          style={[
            styles.headerLeft,
            { flex: 1, minWidth: 0, paddingRight: 12 },
          ]}
        >
          {!!cashierName && (
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text, flexShrink: 1 },
              ]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {cashierName}
            </Text>
          )}
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.closeRegisterBtn,
              { backgroundColor: colors.buttonDark },
            ]}
            onPress={handleOpenCloseRegister}
          >
            <Ionicons name="lock-closed-outline" size={16} color="#FFFFFF" />
            <Text style={styles.closeRegisterBtnText}>{t.closeShiftBtn}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {!soundEnabled && (
        <TouchableOpacity
          onPress={enableSound}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#FEF3C7",
            paddingVertical: 10,
          }}
        >
          <Ionicons name="volume-mute-outline" size={18} color="#92400E" />
          <Text style={{ color: "#92400E", fontWeight: "700" }}>
            {t.enableSoundBanner}
          </Text>
        </TouchableOpacity>
      )}

      {/* PESTAÑAS */}
      <View
        style={[
          styles.tabContainer,
          {
            backgroundColor: colors.card,
            borderBottomColor: colors.border,
            flexDirection: "row",
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
            { flex: 1, minWidth: 0, paddingHorizontal: 4 },
            activeTab === "mesa" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("mesa")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.muted },
              activeTab === "mesa" && styles.tabTextActive,
            ]}
          >
            {t.tabTables} ({tableOrderCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
            { flex: 1, minWidth: 0, paddingHorizontal: 4 },
            activeTab === "llevar" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("llevar")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.muted },
              activeTab === "llevar" && styles.tabTextActive,
            ]}
          >
            {t.tabTakeaway}{" "}
            {ordersToday.some(
              (o) =>
                o.type === "llevar" && o.status === "pagando_transferencia",
            )
              ? "🔴"
              : ""}{" "}
            (
            {
              ordersToday.filter((o) => o.type === "llevar" && o.status !== "pagado")
                .length
            }
            )
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { flex: 1, minWidth: 0, paddingHorizontal: 4 },
            activeTab === "delivery" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("delivery")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.muted },
              activeTab === "delivery" && styles.tabTextActive,
            ]}
          >
            {t.tabDelivery} ({deliveryCount})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.tabButton,
            { flex: 1, minWidth: 0, paddingHorizontal: 4 },
            activeTab === "pagados" && styles.tabButtonActive,
          ]}
          onPress={() => setActiveTab("pagados")}
        >
          <Text
            style={[
              styles.tabText,
              { color: colors.muted },
              activeTab === "pagados" && styles.tabTextActive,
            ]}
          >
            {t.tabPaid} ({paidTodayCount})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "mesa" && previousTableReviews.length > 0 && (
          <View style={{
            maxHeight: 240, margin: 16, marginBottom: 0, borderRadius: 12,
            borderWidth: 1, borderColor: "#F59E0B",
            backgroundColor: isDark ? "#451a03" : "#FEF3C7", padding: 12,
          }}>
            <Text style={{ color: isDark ? "#fde68a" : "#92400E", fontWeight: "800", marginBottom: 8 }}>
              Mesas ocupadas desde jornadas anteriores ({previousTableReviews.length})
            </Text>
            <ScrollView>
              {previousTableReviews.map((review) => (
                <View key={review.tableId} style={{
                  flexDirection: "row", alignItems: "center", justifyContent: "space-between",
                  gap: 10, paddingVertical: 8,
                }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: isDark ? "#fde68a" : "#92400E", fontWeight: "700" }}>
                      Mesa {review.tableNumber}
                    </Text>
                    <Text style={{ color: isDark ? "#fcd34d" : "#92400E", fontSize: 12 }}>
                      {review.canReleaseNormally
                        ? "Pedidos pagados y entregados"
                        : `Pendientes: ${review.orders.length} pedido(s). Requiere administración.`}
                    </Text>
                  </View>
                  {review.canReleaseNormally && (
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={`Liberar mesa ${review.tableNumber} de jornada anterior`}
                      disabled={reviewLoading || releasing}
                      onPress={() => void handleReleaseTable(review)}
                      style={{ backgroundColor: colors.buttonDark, paddingHorizontal: 14, paddingVertical: 9, borderRadius: 8,
                        opacity: reviewLoading || releasing ? 0.6 : 1 }}
                    >
                      <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>Liberar</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {(activeTab === "mesa" || activeTab === "llevar") && (oldInTab > 0 || showOlderOrders) && (
          <TouchableOpacity accessibilityRole="button"
            onPress={() => setShowOlderOrders((value) => !value)}
            style={{ padding: 12, marginHorizontal: 16, marginTop: 10, borderRadius: 10,
              backgroundColor: isDark ? "#1E293B" : "#E2E8F0" }}>
            <Text style={{ color: colors.text, textAlign: "center", fontWeight: "700" }}>
              {showOlderOrders ? "Volver a pedidos de hoy" : `Ver pendientes anteriores (${oldInTab})`}
            </Text>
          </TouchableOpacity>
        )}
        {(activeTab === "mesa" || activeTab === "llevar") && (
          <OrdersFeature
            orders={ordersOnScreen}
            setOrders={setOrders}
            markAsPaid={markAsPaid}
            setPaidHistory={setPaidHistory}
            showToast={showToast}
            filterType={activeTab}
            setActiveTab={setActiveTab}
            lang={language}
            isDark={isDark}
            autoPrint={autoPrint}
          />
        )}
        {activeTab === "delivery" && (
          <DeliveryOrdersPanel
            branchId={branchId}
            isDark={isDark}
            showToast={showToast}
            refreshKey={deliveryRefreshKey}
          />
        )}
        {activeTab === "pagados" && (
          <PaidOrdersPanel
            orders={paidOrders}
            isDark={isDark}
            loading={ordersLoading}
          />
        )}
      </View>

      {/* MODAL DE CUADRE DE CAJA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={closeRegisterModal}
        onRequestClose={() => setCloseRegisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalBox,
              {
                backgroundColor: colors.card,
                maxHeight: screenHeight * 0.92,
                maxWidth: 640,
                paddingHorizontal:
                  screenWidth < 360 ? 14 : screenWidth < 420 ? 18 : 24,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.registerSummaryTitle}
              </Text>
              <TouchableOpacity onPress={() => setCloseRegisterModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            {closureError && (
              <Text accessibilityRole="alert" style={{ color: "#DC2626", paddingBottom: 8, fontSize: 13 }}>{closureError}</Text>
            )}
            <ScrollView
              style={{ flexShrink: 1 }}
              contentContainerStyle={{ paddingBottom: 4 }}
              showsVerticalScrollIndicator={false}
            >
              <View
                style={[
                  styles.summaryContainer,
                  {
                    backgroundColor: colors.background,
                    borderColor: colors.border,
                    padding: screenWidth < 360 ? 14 : 20,
                  },
                ]}
              >
                <Text style={[styles.summarySubtitle, { color: colors.muted }]}>
                  {t.shiftSummarySubtitle}
                </Text>
                <View
                  style={[
                    styles.summaryRow,
                    isNarrowScreen && { flexWrap: "wrap", gap: 6 },
                  ]}
                >
                  <View style={styles.summaryItem}>
                    <Ionicons name="cash-outline" size={24} color="#10B981" />
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      {t.cashClosureExpected}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.summaryValueEfectivo,
                      isNarrowScreen && { fontSize: 16 },
                    ]}
                  >
                    ${totalEfectivo.toLocaleString("es-CO")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryRow,
                    isNarrowScreen && { flexWrap: "wrap", gap: 6 },
                  ]}
                >
                  <View style={styles.summaryItem}>
                    <Ionicons
                      name="swap-horizontal-outline"
                      size={24}
                      color="#3B82F6"
                    />
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      {t.transfersAppBank}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.summaryValueTransfer,
                      isNarrowScreen && { fontSize: 16 },
                    ]}
                  >
                    ${totalTransferencia.toLocaleString("es-CO")}
                  </Text>
                </View>
                <View
                  style={[
                    styles.summaryRow,
                    isNarrowScreen && { flexWrap: "wrap", gap: 6 },
                  ]}
                >
                  <View style={styles.summaryItem}>
                    <Ionicons name="card-outline" size={24} color="#8B5CF6" />
                    <Text style={[styles.summaryLabel, { color: colors.text }]}>
                      {t.payCard}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.summaryValueTransfer,
                      { color: "#8B5CF6" },
                      isNarrowScreen && { fontSize: 16 },
                    ]}
                  >
                    ${totalDatafono.toLocaleString("es-CO")}
                  </Text>
                </View>
                <View style={[styles.summaryRow, isNarrowScreen && { flexWrap: "wrap", gap: 6 }]}>
                  <Text style={{ color: colors.text, fontWeight: "600" }}>{t.cashClosureWompi}</Text>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>{fmtCash(totalWompi)}</Text>
                </View>
                {loadingShiftSummary && (
                  <Text
                    style={{
                      color: colors.muted,
                      textAlign: "center",
                      marginTop: 8,
                    }}
                  >
                    {t.loadingShiftPayments}
                  </Text>
                )}
                <View
                  style={[styles.divider, { backgroundColor: colors.border }]}
                />
                <View
                  style={[
                    styles.totalSummaryRow,
                    isNarrowScreen && { flexWrap: "wrap", gap: 6 },
                  ]}
                >
                  <Text
                    style={[styles.totalSummaryLabel, { color: colors.text }]}
                  >
                    {t.totalSales}
                  </Text>
                  <Text
                    style={[
                      styles.totalSummaryValue,
                      isNarrowScreen && { fontSize: 22 },
                    ]}
                  >
                    ${totalGlobal.toLocaleString("es-CO")}
                  </Text>
                </View>
              </View>

              {shiftSummary && (
                <View style={{ paddingVertical: 14, gap: 8 }}>
                  <Text style={{ color: colors.text, fontWeight: "700" }}>
                    {t.cashClosureBranch}: {shiftSummary.branchName} · {t.cashClosureShift} #{shiftSummary.scheduleId}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {shiftSummary.paymentsCount} {t.cashClosurePaymentCountNote}
                  </Text>
                  <Text style={{ color: colors.text, fontWeight: "700", marginTop: 5 }}>{t.cashClosureCounted}</Text>
                  <TextInput
                    accessibilityLabel="Efectivo contado físicamente en caja"
                    value={countedCash}
                    onChangeText={(v) => { setCountedCash(v.replace(/\D/g, "")); setConfirmClosure(false); }}
                    editable={!closingShift && !shiftSummary.isClosed}
                    keyboardType="number-pad"
                    placeholder={t.cashClosureCountedPlaceholder}
                    placeholderTextColor={colors.muted}
                    style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
                      color: colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12 }}
                  />
                  {difference !== null && (
                    <Text style={{ color: difference === 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                      {t.cashClosureDiff}: {difference > 0 ? "+" : ""}{fmtCash(difference)}
                      {difference === 0 ? ` · ${t.cashClosureBalanced}` : difference < 0 ? ` · ${t.cashClosureShortage}` : ` · ${t.cashClosureOverage}`}
                    </Text>
                  )}
                  <Text style={{ color: colors.text, fontWeight: "700", marginTop: 5 }}>{t.cashClosureNotes}</Text>
                  <TextInput
                    accessibilityLabel="Observaciones del cierre"
                    value={closureNotes}
                    onChangeText={(v) => { setClosureNotes(v.slice(0, 500)); setConfirmClosure(false); }}
                    editable={!closingShift && !shiftSummary.isClosed}
                    multiline
                    maxLength={500}
                    placeholder={t.cashClosureNotesPlaceholder}
                    placeholderTextColor={colors.muted}
                    style={{ borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
                      color: colors.text, paddingHorizontal: 14, paddingVertical: 12, borderRadius: 12, minHeight: 64 }}
                  />
                  {confirmClosure && (
                    <View style={{ backgroundColor: isDark ? "#422006" : "#FEF3C7", borderRadius: 10, padding: 12 }}>
                      <Text style={{ color: isDark ? "#FDE68A" : "#92400E", fontSize: 13 }}>
                        {t.cashClosureWarning}
                      </Text>
                    </View>
                  )}
                </View>
              )}
              <TouchableOpacity
                disabled={loadingShiftSummary || closingShift || !shiftSummary || shiftSummary.isClosed || parsedCash === null}
                style={[
                  styles.closeShiftBtn,
                  { backgroundColor: colors.buttonDark,
                    opacity: loadingShiftSummary || closingShift || !shiftSummary || shiftSummary.isClosed || parsedCash === null ? 0.5 : 1 },
                ]}
                onPress={() => { void handleCloseRegister(); }}
              >
                <Text style={styles.closeShiftBtnText}>
                  {closingShift ? t.cashClosureSaving : shiftSummary?.isClosed
                    ? t.cashClosureAlreadyClosed : confirmClosure ? t.cashClosureConfirm : t.cashClosureReview}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={!!tableToRelease}
        onRequestClose={() => setTableToRelease(null)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.6)",
            justifyContent: "center",
            alignItems: "center",
            padding: 24,
          }}
        >
          <View
            style={{
              width: "100%",
              maxWidth: 360,
              backgroundColor: colors.card,
              borderRadius: 20,
              padding: 22,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <Text
              style={{
                fontSize: 18,
                fontWeight: "800",
                color: colors.text,
                textAlign: "center",
              }}
            >
              {t.releaseTableTitle.replace(
                "{number}",
                String(tableToRelease?.tableNumber ?? ""),
              )}
            </Text>
            <Text
              style={{
                color: colors.muted,
                textAlign: "center",
                marginTop: 8,
                marginBottom: 18,
              }}
            >
              Se liberará una mesa de jornada anterior cuyos pedidos están entregados y pagados.
              Los pedidos se conservarán en el historial.
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: colors.border,
                  alignItems: "center",
                }}
                disabled={releasing}
                onPress={() => setTableToRelease(null)}
              >
                <Text style={{ color: colors.text, fontWeight: "bold" }}>
                  {t.cancel}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: 14,
                  borderRadius: 12,
                  backgroundColor: "#E61C24",
                  alignItems: "center",
                  opacity: releasing ? 0.6 : 1,
                }}
                disabled={releasing}
                onPress={confirmReleaseTable}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                  {releasing ? t.releasing : t.release}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

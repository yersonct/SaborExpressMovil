import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
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
import { useCashierContext } from "@/features/cashier";

import { STAFF_TODAY, Employee, Order } from "./CashierData";
import { OrdersFeature } from "./OrdersFeature";
import { DeliveryOrdersPanel } from "./DeliveryOrdersPanel";
import { PaidOrdersPanel } from "./PaidOrdersPanel";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { useCashierOrders } from "@/features/cashier";
import { useTables } from "@/features/tables/hooks/useTables";
import { TableStatus } from "@/features/tables/types/table.types";
import { useCashierNotifications } from "../hooks/useCashierNotifications";
import { paymentService } from "@/features/payments/services/paymentService";
import { orderService, OrderStatus, OrderType } from "@/features/orders";
import type { CashierShiftSummary } from "@/features/payments/types/payment.types";
import { isReadyForCashier } from "./DeliveryOrdersPanel";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { isColombiaToday } from "@/features/shared/utils/colombia-date";

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

  const [activeTab, setActiveTab] = useState<
    "mesa" | "llevar" | "delivery" | "pagados" | "personal"
  >("mesa");
  const { branchId } = useMyBranch();
  const {
    orders,
    setOrders,
    loading: ordersLoading,
    error: ordersError,
    markAsPaid,
    paidOrdersAwaitingDelivery,
    paidOrders,
    tablesWithBlockingOrders,
  } = useCashierOrders(branchId);

  const { tables, setTableStatus } = useTables(branchId);

  const tablesWithoutOrder = tables.filter(
    (tb) =>
      !ordersLoading &&
      !ordersError &&
      tb.status === TableStatus.Occupied &&
      !tablesWithBlockingOrders.has(tb.id) &&
      !orders.some((o) => o.table === tb.number),
  );
  const tableOrderCount =
    orders.filter((order) => order.type === "mesa").length +
    paidOrdersAwaitingDelivery.length;

  const [tableToRelease, setTableToRelease] = useState<{
    id: number;
    number: number;
  } | null>(null);
  const [releasing, setReleasing] = useState(false);

  const handleReleaseTable = (tableId: number, tableNumber: number) => {
    setTableToRelease({ id: tableId, number: tableNumber });
  };

  const confirmReleaseTable = async () => {
    if (!tableToRelease) return;
    const target = tableToRelease;
    setReleasing(true);
    setTableToRelease(null);
    try {
      await setTableStatus(target.id, TableStatus.Available);
      showToast(t.tableReleased.replace("{table}", String(target.number)));
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
          isColombiaToday(o.createdAt),
      );
      // Mismo criterio del panel: efectivo, o Wompi ya aprobado
      const checks = await Promise.all(candidates.map(isReadyForCashier));
      const confirmedDeliveries = all.filter(
        (o) =>
          o.orderType === OrderType.Delivery &&
          (o.status === OrderStatus.Confirmed ||
            o.status === OrderStatus.InPreparation ||
            o.status === OrderStatus.Ready) &&
          isColombiaToday(o.createdAt),
      ).length;
      // La pestaña también muestra los domicilios confirmados en el pie.
      setDeliveryCount(checks.filter(Boolean).length + confirmedDeliveries);
    } catch {
      // Silencioso: se reintenta en el siguiente ciclo
    }
  }, [branchId]);

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
  const [shiftSummary, setShiftSummary] = useState<CashierShiftSummary | null>(
    null,
  );
  const [loadingShiftSummary, setLoadingShiftSummary] = useState(false);

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
    try {
      const summary = await paymentService.getMyShift();
      setShiftSummary(summary);
    } catch {
      // Silencioso: si falla, el modal muestra $0 en vez de romperse.
      // El cajero puede cerrar y reintentar.
    } finally {
      setLoadingShiftSummary(false);
    }
  };

  const handleCloseRegister = () => {
    setCloseRegisterModal(false);
    showToast(t.toastShiftClosed);
  };

  // Reemplaza los totales locales falsos por los reales del backend.
  const totalEfectivo = shiftSummary?.totalCash ?? 0;
  const totalTransferencia = shiftSummary?.totalTransfer ?? 0;
  const totalDatafono = shiftSummary?.totalCard ?? 0;
  const totalGlobal = shiftSummary?.totalAmount ?? 0;

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
            {orders.some(
              (o) =>
                o.type === "llevar" && o.status === "pagando_transferencia",
            )
              ? "🔴"
              : ""}{" "}
            (
            {
              orders.filter((o) => o.type === "llevar" && o.status !== "pagado")
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
            {t.tabPaid} ({paidOrders.length})
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {activeTab === "mesa" && tablesWithoutOrder.length > 0 && (
          <View
            style={{
              maxHeight: 190,
              margin: 16,
              marginBottom: 0,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#F59E0B",
              backgroundColor: isDark ? "#451a03" : "#FEF3C7",
              padding: 12,
            }}
          >
            <Text
              style={{
                color: isDark ? "#fde68a" : "#92400E",
                fontWeight: "800",
                marginBottom: 8,
              }}
            >
              {t.tablesOccupiedNoOrder.replace(
                "{count}",
                String(tablesWithoutOrder.length),
              )}
            </Text>
            <ScrollView>
              {tablesWithoutOrder.map((tb) => (
                <View
                  key={tb.id}
                  style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    paddingVertical: 6,
                  }}
                >
                  <Text
                    style={{
                      color: isDark ? "#fde68a" : "#92400E",
                      fontWeight: "600",
                    }}
                  >
                    {t.tableNumber.replace("{number}", String(tb.number))}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleReleaseTable(tb.id, tb.number)}
                    style={{
                      backgroundColor: colors.buttonDark,
                      paddingHorizontal: 14,
                      paddingVertical: 8,
                      borderRadius: 8,
                    }}
                  >
                    <Text style={{ color: "#FFFFFF", fontWeight: "bold" }}>
                      {t.release}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {(activeTab === "mesa" || activeTab === "llevar") && (
          <OrdersFeature
            orders={orders}
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
                      {t.cashInDrawer}
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

              <TouchableOpacity
                style={[
                  styles.closeShiftBtn,
                  { backgroundColor: colors.buttonDark },
                ]}
                onPress={handleCloseRegister}
              >
                <Text style={styles.closeShiftBtnText}>
                  {t.approveAndCloseShift}
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
                String(tableToRelease?.number ?? ""),
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
              {t.releaseTableMessage}
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

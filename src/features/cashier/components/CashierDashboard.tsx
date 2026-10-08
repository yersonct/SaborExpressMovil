import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Platform,
  LayoutAnimation,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import { styles } from "../style/CashierStyles";
import { useCashierContext } from "../context/CashierContext";

import { STAFF_TODAY, Employee, Order } from "./CashierData";
import { OrdersFeature } from "./OrdersFeature";
import { DeliveryOrdersPanel } from "./DeliveryOrdersPanel";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { useCashierOrders } from "../hooks/useCashierOrders";
import { useCashierNotifications } from "../hooks/useCashierNotifications";
import { paymentService } from "@/features/payments/services/paymentService";
import { orderService } from "@/features/orders/services/orderService";
import { OrderStatus, OrderType } from "@/features/orders/types/order.types";
import type { CashierShiftSummary } from "@/features/payments/types/payment.types";
import { isReadyForCashier } from "./DeliveryOrdersPanel";

import {
  TRANSLATIONS,
  LanguageCode,
} from "./../../../locales/CashierTranslations";


export default function CashierDashboard() {
  const navigation = useNavigation();
  const { language, isDark, notificationSound } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS["es"];

  // 🔥 PALETA GLOBAL DE COLORES
  const colors = {
    background: isDark ? "#0F172A" : "#F8FAFC",
    card: isDark ? "#1E293B" : "#FFFFFF",
    text: isDark ? "#F8FAFC" : "#1E293B",
    muted: isDark ? "#94A3B8" : "#64748B",
    border: isDark ? "#334155" : "#E2E8F0",
    buttonDark: isDark ? "#334155" : "#1E293B",
  };

  const [activeTab, setActiveTab] = useState<
    "mesa" | "llevar" | "delivery" | "personal"
  >("mesa");
  const { branchId } = useMyBranch();
  const {
    orders,
    setOrders,
    loading: ordersLoading,
    markAsPaid,
    refetch,
  } = useCashierOrders(branchId);
  // Pedidos de domicilio que se ven en la pestaña Delivery (mismo filtro que el panel)
  const [deliveryCount, setDeliveryCount] = useState(0);
  const fetchDeliveryCount = useCallback(async () => {
    if (!branchId) {
      setDeliveryCount(0);
      return;
    }
    try {
      const all = await orderService.getAll(branchId);
      const todayStr = new Date().toDateString();
      const candidates = all.filter(
        (o) =>
          o.orderType === OrderType.Delivery &&
          o.status === OrderStatus.Pending &&
          o.orderDetails.length > 0 &&
          new Date(o.createdAt).toDateString() === todayStr,
      );
      // Mismo criterio del panel: efectivo, o Wompi ya aprobado
      const checks = await Promise.all(candidates.map(isReadyForCashier));
      setDeliveryCount(checks.filter(Boolean).length);
    } catch {
      // Silencioso: se reintenta en el siguiente ciclo
    }
  }, [branchId]);

  useEffect(() => {
    fetchDeliveryCount();
    const id = setInterval(fetchDeliveryCount, 15000);
    return () => clearInterval(id);
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

  const { soundEnabled, enableSound } = useCashierNotifications(async (n) => {
    refetch();
    fetchDeliveryCount();
    setDeliveryRefreshKey((k) => k + 1);

    if (n.type !== "OrderReady" && n.type !== "OrderCreated") return;

    // Se consulta el pedido para saber en qué pestaña quedó
    let lugar = "";
    if (n.relatedEntityId) {
      try {
        const o = await orderService.getById(n.relatedEntityId);
        lugar =
          o.orderType === OrderType.DineIn
            ? `En Mesa${o.tableNumber ? ` ${o.tableNumber}` : ""}`
            : o.orderType === OrderType.Delivery
              ? "Delivery"
              : "Para Llevar";
      } catch {}
    }
    const sufijo = lugar ? ` — pestaña: ${lugar}` : "";
    const numero = n.relatedEntityId ? ` #${n.relatedEntityId}` : "";

    if (n.type === "OrderCreated") {
      showToast(`🔔 Llegó un pedido nuevo${numero}${sufijo}`);
    } else {
      showToast(`✅ El pedido${numero} está listo para cobrar${sufijo}`);
    }
  }, notificationSound);

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
        <View style={styles.headerLeft}>
          <View>
            <Text style={[styles.headerSubtitle, { color: colors.muted }]}>
              {t.shiftManagement}
            </Text>
          </View>
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
          { backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.tabButton,
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
            {t.tabTables} (
            {
              orders.filter((o) => o.type === "mesa" && o.status !== "pagado")
                .length
            }
            )
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.tabButton,
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
      </View>

      <View style={styles.content}>
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
      </View>

      {/* MODAL DE CUADRE DE CAJA */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={closeRegisterModal}
        onRequestClose={() => setCloseRegisterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalBox, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {t.registerSummaryTitle}
              </Text>
              <TouchableOpacity onPress={() => setCloseRegisterModal(false)}>
                <Text style={styles.closeIcon}>✕</Text>
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.summaryContainer,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.summarySubtitle, { color: colors.muted }]}>
                {t.shiftSummarySubtitle}
              </Text>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="cash-outline" size={24} color="#10B981" />
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    {t.cashInDrawer}
                  </Text>
                </View>
                <Text style={styles.summaryValueEfectivo}>
                  ${totalEfectivo.toLocaleString("es-CO")}
                </Text>
              </View>
              <View style={styles.summaryRow}>
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
                <Text style={styles.summaryValueTransfer}>
                  ${totalTransferencia.toLocaleString("es-CO")}
                </Text>
              </View>
              <View style={styles.summaryRow}>
                <View style={styles.summaryItem}>
                  <Ionicons name="card-outline" size={24} color="#8B5CF6" />
                  <Text style={[styles.summaryLabel, { color: colors.text }]}>
                    Datáfono
                  </Text>
                </View>
                <Text
                  style={[styles.summaryValueTransfer, { color: "#8B5CF6" }]}
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
                  Cargando pagos del turno...
                </Text>
              )}
              <View
                style={[styles.divider, { backgroundColor: colors.border }]}
              />
              <View style={styles.totalSummaryRow}>
                <Text
                  style={[styles.totalSummaryLabel, { color: colors.text }]}
                >
                  {t.totalSales}
                </Text>
                <Text style={styles.totalSummaryValue}>
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
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

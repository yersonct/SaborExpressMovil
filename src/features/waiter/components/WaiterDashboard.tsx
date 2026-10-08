import React, { useState, useEffect } from "react";
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Modal,
  Image,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

import { orderService } from "@/features/orders/services/orderService";
import {
  OrderType,
  OrderStatus,
  OrderDetailStatus,
} from "@/features/orders/types/order.types";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { AppAlertModal } from "@/features/shared/components/AppAlertModal";
import { NotificationToastContainer, ToastNotification } from "@/features/shared/components/NotificationToast";
import { NotificationCenter } from "@/features/shared/components/NotificationCenter";

import { useAuth } from "@/features/auth/context/AuthContext";
import { getEmployeeIdFromToken, getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { notificationService } from "@/features/notifications/services/notificationService";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
import { TablesGridView } from "./TablesGridView";
import { ActiveOrdersView } from "./ActiveOrdersView";
import { OrderTakingView } from "./OrderTakingView";
import { useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { useWaiterLanguage } from "@/features/waiter/context/WaiterLanguageContext";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { useTables } from "@/features/tables/hooks/useTables";
import { TableStatus } from "@/features/tables/types/table.types";
import { useActiveOrders } from "@/features/orders/hooks/useActiveOrders";
import { useKitchenNotifications } from "@/features/shared/hooks/useKitchenNotifications";
import { styles } from "./style/WaiterDashboardStyles";

const baseFontFamily = Platform.select({
  web: "system-ui, -apple-system, sans-serif",
  default: undefined,
});


export const WaiterDashboard = () => {
  const navigation = useNavigation();
  const { colors } = useWaiterTheme();
  const { t } = useWaiterLanguage();
  const { user } = useAuth();
  const myEmployeeId = user?.token ? getEmployeeIdFromToken(user.token) : null;
  const myUserId = user?.token ? getUserIdFromToken(user.token) : null;
  const { branchId } = useMyBranch();
  const {
    tables: realTables,
    setTableStatus,
    refetch: refetchTables,
  } = useTables(branchId);

  const tables = realTables
    .filter((table) => table.status !== TableStatus.Inactive)
    .map((table) => ({
      id: String(table.id),
      name: `Mesa ${table.number}`,
      status: table.status === TableStatus.Available ? "Libre" : "Ocupada",
      type: "normal",
    }));

  const [activeTab, setActiveTab] = useState<"MESAS" | "ORDENES">("MESAS");
  const { orders: activeOrders, refetch: refetchOrders } =
    useActiveOrders(branchId);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
const [toasts, setToasts] = useState<ToastNotification[]>([]);
const [notificationHistory, setNotificationHistory] = useState<ToastNotification[]>([]);
const [unreadCount, setUnreadCount] = useState(0);

  // Carga el histórico de notificaciones guardado en el backend al entrar
  // a la pantalla (antes se perdía al recargar porque solo vivía en memoria).
  useEffect(() => {
    if (!myUserId) return;
    notificationService
      .getByUser(myUserId)
      .then((list) => {
        // La pantalla de Mesero solo debe mostrar notificaciones de "pedido
        // listo" — si este usuario también tiene rol de Gerente/Administrador,
        // el backend igual le manda notificaciones de "Pedido nuevo" (OrderCreated)
        // que son para esos otros roles, no para el panel de Mesero.
        const mapped: ToastNotification[] = list
          .map((n) => ({
            id: n.id,
            title: n.title,
            message: n.message,
            type: normalizeNotificationType(n.type),
            relatedEntityType: n.relatedEntityType,
            relatedEntityId: n.relatedEntityId,
          }))
          .filter((n) => n.type === "OrderReady");
        setNotificationHistory(mapped);
      })
      .catch((err) => {
        console.log("No se pudo cargar el histórico de notificaciones:", err);
      });

    // El contador de la campana representa NO LEÍDAS, no el total del historial.
    notificationService
      .getUnreadCount(myUserId)
      .then(setUnreadCount)
      .catch(() => {});
  }, [myUserId]);

  // Sonido + refresco inmediato cuando cocina cambia el estado de un pedido.
const { soundEnabled, enableSound } = useKitchenNotifications((notification) => {
  if (notification.relatedEntityType === "Order") {
    refetchOrders();
    // Un pago puede haber liberado la mesa en el backend — sin esto, el
    // mesero seguía viéndola "ocupada" hasta refrescar manualmente.
    refetchTables();
  }

  const normalizedType = normalizeNotificationType(notification.type);

  // Igual que con el histórico: en la pantalla de Mesero solo nos interesa
  // "pedido listo". Si este usuario también es Gerente/Administrador, las
  // notificaciones de "Pedido nuevo" no deben aparecer ni sonar aquí.
  if (normalizedType !== "OrderReady") return;

  const toast: ToastNotification = {
    id: notification.id ?? Date.now(),
    title: notification.title,
    message: notification.message,
    type: normalizedType,
    relatedEntityType: notification.relatedEntityType,
    relatedEntityId: notification.relatedEntityId,
  };
  setToasts((prev) => [...prev, toast]);
  setNotificationHistory((prev) => [...prev, toast]);
  // Es una notificación nueva que aún no se ha "visto" (no se ha abierto la campana).
  setUnreadCount((prev) => prev + 1);
});

const dismissToast = (id: number) => {
  setToasts((prev) => prev.filter((t) => t.id !== id));
};

const handleNotificationSelect = (notification: ToastNotification) => {
  if (notification.relatedEntityType === "Order" && notification.relatedEntityId) {
    setActiveTab("ORDENES");
    setExpandedOrderId(String(notification.relatedEntityId));
  }
};

// Abrir la campana = "vista", el número desaparece. La lista se queda
// visible hasta que el usuario le dé "Limpiar" explícitamente.
const handleOpenNotifications = () => {
  setUnreadCount(0);
  if (myUserId) {
    notificationService.markAllAsRead(myUserId).catch(() => {});
  }
};

// "Limpiar" ahora sí las borra en el backend, para que no reaparezcan
// al salir y volver a entrar a la pantalla.
const handleClearNotifications = () => {
  const idsToDelete = notificationHistory.map((n) => n.id);
  setNotificationHistory([]);
  setUnreadCount(0);
  idsToDelete.forEach((id) => {
    notificationService.delete(id).catch(() => {});
  });
};

  const [isQrMenuVisible, setIsQrMenuVisible] = useState(false);
  const [activeTableForOrder, setActiveTableForOrder] = useState<any>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [destType, setDestType] = useState<"particular" | "mesa">("particular");
  const [linkedTableId, setLinkedTableId] = useState<string | null>(null);
  const [toGoCustomerName, setToGoCustomerName] = useState("");

  const handleTablePress = (table: any) => {
    if (table.status === "Ocupada") {
      const orderForTable = activeOrders.find((o) => o.tableId === table.id);
      const isMyOrder = orderForTable?.employeeId === myEmployeeId;

      if (isMyOrder) {
        Alert.alert(
          t.tableOccupiedTitle || "Mesa Ocupada",
          t.tableOccupiedMessage ||
            "Ve a la pestaña de órdenes activas para ver o agregar productos.",
          [
            {
              text: t.tableOccupiedViewOrders || "Ver Órdenes",
              onPress: () => setActiveTab("ORDENES"),
            },
            { text: t.tableOccupiedCancel || "Cancelar", style: "cancel" },
          ],
        );
      } else {
        const waiterName = orderForTable?.employeeName || "otro mesero";
        Alert.alert(
          "Mesa no disponible",
          `Esta mesa está siendo atendida por ${waiterName}.`,
          [{ text: "Entendido", style: "cancel" }],
        );
      }
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({ ...table, isGlobalToGo: false });
    setActiveOrderId(null); // 👈 nuevo
    setOrderItems([]);
  };

  const handleStartToGoOrder = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setActiveTableForOrder({
      id: `temp_togo`,
      name: t.dashboardParaLlevar || `Pedido Para Llevar`,
      isGlobalToGo: true,
    });
    setActiveOrderId(null);
    setDestType("particular");
    setLinkedTableId(null);
    setToGoCustomerName("");
    setOrderItems([]);
  };

  const handleAddMoreToOrder = (existingOrder: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let table = tables.find((t) => t.id === existingOrder.tableId) || {
      id: existingOrder.tableId,
      name: existingOrder.tableName,
      status: "Ocupada",
      isGlobalToGo: false,
    };
    setActiveTableForOrder(table);
    setActiveOrderId(Number(existingOrder.id));
    setOrderItems(
      existingOrder.items.map((item: any) => ({
        ...item,
        alreadySubmitted: true,
      })),
    );
    setIsCartExpanded(false);
  };

  const handleCancelOrder = async (orderToCancel: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    try {
      // Se consulta el pedido REAL justo ahora: la lista de la pantalla puede
      // estar vieja (cocina pudo marcar algo "Listo" sin que el mesero lo vea).
      const fresh = await orderService.getById(Number(orderToCancel.id));
      const live = fresh.orderDetails.filter(
        (d) =>
          d.status !== OrderDetailStatus.Voided &&
          d.status !== OrderDetailStatus.Cancelled,
      );
      const pending = live.filter((d) => d.status === OrderDetailStatus.Pending);
      // Si TODO está en espera se cancela el pedido completo (libera la mesa).
      // Si cocina ya tocó algo, solo se anulan los productos que siguen en espera.
      const onlyPending = live.length > 0 && pending.length === live.length;

      if (onlyPending) {
        await orderService.cancel(
          Number(orderToCancel.id),
          "Cancelado por el mesero",
        );
      } else {
        await Promise.all(
          pending.map((d) =>
            orderService.voidDetail(d.id, "Quitado por el mesero"),
          ),
        );
      }
      await refetchOrders();
      await refetchTables();
    } catch (err: any) {
      showAppAlert(
        t.errorTitle || "Error",
        err?.message ?? "No se pudo cancelar el pedido.",
      );
    }
  };

  const handleDeliverOrder = async (orderToDeliver: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    await refetchOrders();
  };

  const handleMarkOrderReady = async (orderToMarkReady: any) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const realOrder = activeOrders.find((o) => o.id === orderToMarkReady.id);
    const pendingItems = (realOrder?.items ?? []).filter(
      (i: any) => !i.isDelivered,
    );

    if (pendingItems.length === 0) {
      return;
    }

    const allReady = pendingItems.every((i: any) => i.status === "Ready");
    if (!allReady) {
      showAppAlert(
        t.warningTitle || "Aviso",
        "Todavía hay platos que no están listos en cocina.",
      );
      return;
    }

    try {
      await Promise.all(
        pendingItems.map((item: any) =>
          orderService.markDelivered(Number(item.cartId)),
        ),
      );
      await refetchOrders();
    } catch (err: any) {
      showAppAlert(
        t.errorTitle || "Error",
        err?.message ?? "No se pudo marcar el pedido como entregado.",
      );
    }
  };

  const handleAddItem = (product: any, note: string = "") => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const defaultToGo = activeTableForOrder?.isGlobalToGo ? true : false;

    // Solo se agrupa con líneas NUEVAS (aún no enviadas a cocina). Si el plato
    // ya fue enviado, se crea una línea aparte: así llega a cocina como un
    // lote nuevo y no altera lo que ya estaba en preparación o listo.
    const existingIndex = orderItems.findIndex(
      (item) =>
        item.id === product.id &&
        item.isToGo === defaultToGo &&
        (item.note || "") === note &&
        item.isDelivered !== true &&
        !item.alreadySubmitted,
    );

    if (existingIndex >= 0) {
      setOrderItems((prev) =>
        prev.map((item, i) =>
          i === existingIndex ? { ...item, quantity: item.quantity + 1 } : item,
        ),
      );
    } else {
      setOrderItems([
        ...orderItems,
        {
          ...product,
          quantity: 1,
          isToGo: defaultToGo,
          note,
          cartId: Math.random().toString(),
          isDelivered: false,
        },
      ]);
    }
    if (orderItems.length === 0) setIsCartExpanded(true);
  };

  const handleUpdateItemNote = (cartId: string, note: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToUpdate = orderItems.find((i) => i.cartId === cartId);

    const lockMessage = getKitchenLockMessage(itemToUpdate);
    if (lockMessage) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        lockMessage,
      );
      return;
    }

    setOrderItems((items) =>
      items.map((item) => (item.cartId === cartId ? { ...item, note } : item)),
    );
  };
  // Bloquea edición (nota / para llevar) si cocina ya tomó el plato.
  // Devuelve el mensaje de alerta con el estado real, o null si se puede editar.
  const getKitchenLockMessage = (item: any): string | null => {
    if (item?.status === "InPreparation") {
      return "Este plato ya está en preparación en cocina, no se puede modificar.";
    }
    if (item?.status === "Ready") {
      return "Este plato ya está listo en cocina, no se puede modificar.";
    }
    return null;
  };

  const handleRemoveItem = (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToRemove = orderItems.find((i) => i.cartId === cartId);
    if (itemToRemove?.isDelivered) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        t.actionNotAllowedRemoveMessage ||
          "No puedes eliminar un plato que ya fue entregado al cliente.",
      );
      return;
    }
    if (itemToRemove?.alreadySubmitted) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        "Este plato ya fue enviado a cocina y no se puede quitar desde aquí.",
      );
      return;
    }
    const updated = orderItems.filter((item) => item.cartId !== cartId);
    setOrderItems(updated);
    if (updated.length === 0) setIsCartExpanded(false);
  };

  const toggleItemToGo = (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToToggle = orderItems.find((i) => i.cartId === cartId);

    if (itemToToggle?.isDelivered) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        t.actionNotAllowedToGoMessage ||
          'El plato ya se sirvió, no se puede cambiar a "para llevar".',
      );
      return;
    }

    const lockMessage = getKitchenLockMessage(itemToToggle);
    if (lockMessage) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        lockMessage,
      );
      return;
    }

    setOrderItems((items) =>
      items.map((i) => (i.cartId === cartId ? { ...i, isToGo: !i.isToGo } : i)),
    );
  };

  const handleSubmitOrder = async () => {
    if (orderItems.length === 0)
      return showAppAlert(
        t.errorTitle || "Error",
        t.errorAddProductsMessage || "Agrega productos al pedido.",
      );

    if (!branchId) {
      return showAppAlert(
        t.errorTitle || "Error",
        "No se pudo determinar tu sede.",
      );
    }

    // ----- CASO A: ya existe un pedido para esta mesa, solo agregamos lo nuevo -----
    if (activeOrderId) {
      const newItems = orderItems.filter((item) => !item.alreadySubmitted);

      if (newItems.length === 0) {
        showAppAlert(
          t.warningTitle || "Aviso",
          "No hay productos nuevos para enviar.",
        );
        return;
      }

      try {
        await orderService.addDetails(
          activeOrderId,
          newItems.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
            notes: item.note?.trim() || null,
            isToGo: item.isToGo ?? false,
          })),
        );

        await refetchOrders();

        showAppAlert(
          t.orderUpdatedTitle || "¡Pedido Actualizado!",
          (
            t.orderUpdatedMessage || "Se actualizó la cuenta de {tableName}."
          ).replace("{tableName}", activeTableForOrder.name),
        );
      } catch (err: any) {
        showAppAlert(
          t.errorTitle || "Error",
          err?.message ?? "No se pudo actualizar el pedido.",
        );
        return;
      }

      setActiveTableForOrder(null);
      setActiveOrderId(null);
      setOrderItems([]);
      setActiveTab("ORDENES");
      return;
    }

    // ----- CASO B: pedido nuevo (mesa libre o para llevar) -----
    let finalTableId: number | null = null;
    let finalTableName = activeTableForOrder.name;
    let orderType = OrderType.DineIn;

    if (activeTableForOrder.isGlobalToGo) {
      orderType = OrderType.ToGo;
      if (destType === "particular") {
        finalTableId = null;
        const personName =
          toGoCustomerName.trim() !== ""
            ? toGoCustomerName.trim()
            : t.orderToGoDefaultName || "Particular";
        finalTableName = (t.orderToGoPrefix || "Llevar - ") + personName;
      } else {
        if (!linkedTableId)
          return showAppAlert(
            t.warningTitle || "Aviso",
            t.warningSelectTableMessage ||
              "Selecciona a qué mesa asignar este pedido.",
          );
        finalTableId = Number(linkedTableId);
        const selectedTable = tables.find((x) => x.id === linkedTableId);
        finalTableName = selectedTable?.name || finalTableName;
      }
    } else {
      finalTableId = Number(activeTableForOrder.id);
    }

    if (finalTableId !== null && !Number.isFinite(finalTableId)) {
      showAppAlert(
        t.errorTitle || "Error",
        "La mesa seleccionada no es válida.",
      );
      return;
    }

    let createdOrder: any = null;
    try {
      createdOrder = await orderService.create({
        tableId: finalTableId,
        branchId,
        orderType,
        notes: null,
        guestName:
          activeTableForOrder.isGlobalToGo && destType === "particular"
            ? toGoCustomerName.trim() || null
            : null,
      });

      await orderService.addDetails(
        createdOrder.id,
        orderItems.map((item) => ({
          productId: item.id,
          quantity: item.quantity,
          notes: item.note?.trim() || null,
          isToGo: item.isToGo ?? false,
        })),
      );

      await orderService.updateStatus(createdOrder.id, OrderStatus.Confirmed);

      await refetchOrders();

      if (finalTableId) {
        await refetchTables();
      }

      showAppAlert(
        t.orderSentTitle || "¡Pedido Enviado!",
        t.orderSentMessage || "El pedido fue enviado a la cocina.",
      );
    } catch (err: any) {
      // Si el pedido ya se creó pero algo después falló (detalles o confirmación),
      // lo cancelamos para no dejar la mesa ocupada "a medias" sin pedido válido.
      if (createdOrder) {
        try {
          await orderService.cancel(
            createdOrder.id,
            "Cancelado automáticamente: error al enviar a cocina",
          );
        } catch (cancelErr) {
          console.log("No se pudo revertir el pedido fallido:", cancelErr);
        }
      }

      await refetchTables();

      showAppAlert(
        t.errorTitle || "Error",
        err?.message ?? "No se pudo crear el pedido. Intenta de nuevo.",
      );
      return;
    }

    setActiveTableForOrder(null);
    setOrderItems([]);
    setToGoCustomerName("");
    setActiveTab("ORDENES");
  };

  // --- RENDER ---
  return (
    <>
      <NotificationToastContainer notifications={toasts} onDismiss={dismissToast} />
      {activeTableForOrder ? (
        <OrderTakingView
          activeTableForOrder={activeTableForOrder}
          setActiveTableForOrder={setActiveTableForOrder}
          orderItems={orderItems}
          isCartExpanded={isCartExpanded}
          setIsCartExpanded={setIsCartExpanded}
          destType={destType}
          setDestType={setDestType}
          toGoCustomerName={toGoCustomerName}
          setToGoCustomerName={setToGoCustomerName}
          tables={tables}
          linkedTableId={linkedTableId}
          setLinkedTableId={setLinkedTableId}
          handleAddItem={handleAddItem}
          handleRemoveItem={handleRemoveItem}
          toggleItemToGo={toggleItemToGo}
          handleUpdateItemNote={handleUpdateItemNote}
          handleSubmitOrder={handleSubmitOrder}
        />
      ) : (
        <SafeAreaView
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.mainHeader,
              { backgroundColor: colors.header, borderColor: colors.border },
            ]}
          >
            <View style={styles.headerTitlesBox}>
              <Text style={[styles.mainSubtitle, { color: colors.mutedText }]}>
                {t.dashboardWaiterPanel || "Panel de Mesero"}
              </Text>
            </View>

            <View
              style={{ flexDirection: "row", gap: 8, alignItems: "center" }}
            >
              <NotificationCenter
                notifications={notificationHistory}
                unreadCount={unreadCount}
                onOpen={handleOpenNotifications}
                onClear={handleClearNotifications}
                onSelect={handleNotificationSelect}
              />
              <TouchableOpacity
                style={styles.toGoButton}
                onPress={handleStartToGoOrder}
              >
                <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
                <Text style={styles.toGoButtonText}>
                  {t.dashboardParaLlevar || "Para Llevar"}
                </Text>
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
                Toca aquí para activar el sonido de pedidos
              </Text>
            </TouchableOpacity>
          )}

          <View
            style={[
              styles.tabsContainer,
              { backgroundColor: colors.header, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity
              style={[styles.tab, activeTab === "MESAS" && styles.activeTab]}
              onPress={() => setActiveTab("MESAS")}
            >
              <Ionicons
                name="grid-outline"
                size={20}
                color={activeTab === "MESAS" ? colors.accent : colors.mutedText}
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedText },
                  activeTab === "MESAS" && { color: colors.accent },
                ]}
              >
                {t.dashboardTabTables || "Plano de Mesas"}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, activeTab === "ORDENES" && styles.activeTab]}
              onPress={() => setActiveTab("ORDENES")}
            >
              <Ionicons
                name="receipt-outline"
                size={20}
                color={
                  activeTab === "ORDENES" ? colors.accent : colors.mutedText
                }
              />
              <Text
                style={[
                  styles.tabText,
                  { color: colors.mutedText },
                  activeTab === "ORDENES" && { color: colors.accent },
                ]}
              >
                {t.dashboardTabOrders || "Órdenes"} ({activeOrders.length})
              </Text>
            </TouchableOpacity>
          </View>

          <View
            style={[styles.content, { backgroundColor: colors.background }]}
          >
            {activeTab === "MESAS" ? (
              <TablesGridView
                tables={tables}
                handleTablePress={handleTablePress}
              />
            ) : (
              <ActiveOrdersView
                activeOrders={activeOrders}
                expandedOrderId={expandedOrderId}
                setExpandedOrderId={setExpandedOrderId}
                handleAddMoreToOrder={handleAddMoreToOrder}
                handleCancelOrder={handleCancelOrder}
                handleMarkOrderReady={handleMarkOrderReady}
                handleDeliverOrder={handleDeliverOrder}
              />
            )}
          </View>
        </SafeAreaView>
      )}
      <AppAlertModal />
    </>
  );
};;

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  LayoutAnimation,
  Platform,
  Text,
  TouchableOpacity,
  View,
  Modal,
  useWindowDimensions,
} from "react-native";
import { useBranchSettings } from "@/features/branches/hooks/useBranchSettings";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";

import {
  orderService,
  OrderType,
  OrderStatus,
  OrderDetailStatus,
  type OccupiedTableWaiter,
} from "@/features/orders";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import {
  NotificationToastContainer,
  ToastNotification,
} from "@/features/shared/components/NotificationToast";
import { NotificationCenter } from "@/features/shared/components/NotificationCenter";

import { useAuth } from "@/features/auth/context/AuthContext";
import {
  getEmployeeIdFromToken,
  getUserIdFromToken,
} from "@/features/auth/services/decodeToken";
import { notificationService } from "@/features/notifications";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
import { TablesGridView } from "./TablesGridView";
import { ActiveOrdersView } from "./ActiveOrdersView";
import { OrderTakingView } from "./OrderTakingView";
import { useWaiterTheme } from "@/features/waiter/context/WaiterThemeContext";
import { useWaiterLanguage } from "@/features/waiter/context/WaiterLanguageContext";
import { useWaiterNotificationPreferences } from "@/features/waiter/context/WaiterNotificationPreferencesContext";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { useMyProfile } from "@/features/employees/hooks/useMyProfile";
import { useTables } from "@/features/tables/hooks/useTables";
import { TableStatus } from "@/features/tables/types/table.types";
import { useActiveOrders } from "@/features/orders/hooks/useActiveOrders";
import { useKitchenNotifications } from "@/features/shared/hooks/useKitchenNotifications";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { getColombiaDayKey } from "@/features/shared/utils/colombia-date";
import { styles } from "./style/WaiterDashboardStyles";

const baseFontFamily = Platform.select({
  web: "system-ui, -apple-system, sans-serif",
  default: undefined,
});

const WAITER_LAST_NOTIFICATIONS_VIEWED_KEY =
  "saborexpress-waiter-notifications-seen-through";

function getTodayInColombiaKey(date: Date): string {
  return getColombiaDayKey(date) ?? "";
}

function isFromColombiaDay(
  createdAt: string | undefined,
  dayKey: string,
): boolean {
  if (!createdAt) return false;
  return getColombiaDayKey(createdAt) === dayKey;
}

export const WaiterDashboard = () => {
  const navigation = useNavigation();
  const { width: windowWidth } = useWindowDimensions();
  const { colors } = useWaiterTheme();
  const { soundNotifications } = useWaiterNotificationPreferences();
  const { t } = useWaiterLanguage();
  const { user } = useAuth();
  const { profile: employeeProfile } = useMyProfile();
  const employeeDisplayName = [employeeProfile?.name, employeeProfile?.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  const myEmployeeId = user?.token ? getEmployeeIdFromToken(user.token) : null;
  const myUserId = user?.token ? getUserIdFromToken(user.token) : null;
  const { branchId } = useMyBranch();
  const { settings: branchSettings } = useBranchSettings(branchId);
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

  const [activeTab, setActiveTab] = useRememberedUiState<"MESAS" | "ORDENES">("waiter:tab", "MESAS", (v): v is "MESAS" | "ORDENES" => v === "MESAS" || v === "ORDENES");
  const { orders: activeOrders, refetch: refetchOrders } =
    useActiveOrders(branchId);
  const [occupiedTableWaiters, setOccupiedTableWaiters] = useState<
    OccupiedTableWaiter[]
  >([]);
  const refetchOccupiedTableWaiters = useCallback(async () => {
    if (!branchId) {
      setOccupiedTableWaiters([]);
      return null;
    }
    try {
      const assignments = await orderService.getOccupiedTableWaiters(branchId);
      setOccupiedTableWaiters(assignments);
      return assignments;
    } catch (error) {
      console.log("No se pudo actualizar quién atiende cada mesa:", error);
      return null;
    }
  }, [branchId]);

  useEffect(() => {
    void refetchOccupiedTableWaiters();
  }, [refetchOccupiedTableWaiters]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);
  const [notificationHistory, setNotificationHistory] = useState<
    ToastNotification[]
  >([]);
  const [todayKey, setTodayKey] = useState(() =>
    getTodayInColombiaKey(new Date()),
  );
  const [lastSeenNotificationId, setLastSeenNotificationId] = useState<
    number | null
  >(null);

  useEffect(() => {
    const timer = setInterval(
      () => setTodayKey(getTodayInColombiaKey(new Date())),
      60_000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    if (!myUserId) {
      setLastSeenNotificationId(0);
      return () => {
        active = false;
      };
    }

    AsyncStorage.getItem(`${WAITER_LAST_NOTIFICATIONS_VIEWED_KEY}:${myUserId}`)
      .then((stored) => {
        if (!active) return;
        const parsed = stored ? Number(stored) : 0;
        setLastSeenNotificationId(
          Number.isFinite(parsed) && parsed > 0 ? parsed : 0,
        );
      })
      .catch(() => {
        if (active) setLastSeenNotificationId(0);
      });

    return () => {
      active = false;
    };
  }, [myUserId]);

  const todaysNotifications = useMemo(
    () =>
      notificationHistory.filter((item) =>
        isFromColombiaDay(item.createdAt, todayKey),
      ),
    [notificationHistory, todayKey],
  );
  const unreadCount = useMemo(() => {
    if (lastSeenNotificationId === null) return 0;
    return todaysNotifications.filter(
      (item) => item.isRead !== true && item.id > lastSeenNotificationId,
    ).length;
  }, [todaysNotifications, lastSeenNotificationId]);

  useEffect(() => {
    setNotificationHistory((prev) =>
      prev.filter((item) => isFromColombiaDay(item.createdAt, todayKey)),
    );
    setToasts((prev) =>
      prev.filter((item) => isFromColombiaDay(item.createdAt, todayKey)),
    );
  }, [todayKey]);

  // Carga historial al entrar y al recibir cambios o recuperar la conexión.
  const loadNotificationHistory = useCallback(async () => {
    if (!myUserId) return;
    try {
      const list = await notificationService.getByUser(myUserId);
      const mapped: ToastNotification[] = list
        .filter((n) => isFromColombiaDay(n.createdAt, todayKey))
        .map((n) => ({
          id: n.id,
          title: n.title,
          message: n.message,
          type: normalizeNotificationType(n.type),
          relatedEntityType: n.relatedEntityType,
          relatedEntityId: n.relatedEntityId,
          createdAt: n.createdAt,
          isRead: n.isRead,
        }))
        .filter((n) => n.type === "OrderReady" || n.type === "TableAvailable");
      setNotificationHistory((previous) => {
        const merged = new Map<number, ToastNotification>();
        mapped.forEach((item) => merged.set(item.id, item));
        previous
          .filter((item) => isFromColombiaDay(item.createdAt, todayKey))
          .forEach((item) => merged.set(item.id, item));
        return Array.from(merged.values());
      });
    } catch (err) {
      console.log("No se pudo cargar el histórico de notificaciones:", err);
    }
  }, [myUserId, todayKey]);

  useEffect(() => {
    void loadNotificationHistory();
  }, [loadNotificationHistory]);

  useRealtimeEvents(
    ["NotificationsChanged", "RealtimeConnected"],
    () => void loadNotificationHistory(),
  );

  // Sonido y aviso inmediato cuando cocina cambia el estado de un pedido.
  const { soundEnabled, enableSound } = useKitchenNotifications(
    (notification) => {
      const normalizedType = normalizeNotificationType(notification.type);

      // Igual que con el histórico: en la pantalla de Mesero solo nos interesa
      // "pedido listo". Si este usuario también es Gerente/Administrador, las
      // notificaciones de "Pedido nuevo" no deben aparecer ni sonar aquí.
      if (
        normalizedType !== "OrderReady" &&
        normalizedType !== "TableAvailable"
      )
        return;

      const createdAt = notification.createdAt ?? new Date().toISOString();
      if (!isFromColombiaDay(createdAt, todayKey)) return;

      const toast: ToastNotification = {
        id: notification.id ?? -Date.now(),
        title: notification.title,
        message: notification.message,
        type: normalizedType,
        relatedEntityType: notification.relatedEntityType,
        relatedEntityId: notification.relatedEntityId,
        createdAt,
        isRead: false,
      };
      setToasts((prev) => [...prev, toast]);
      setNotificationHistory((prev) =>
        prev.some((item) => item.id === toast.id) ? prev : [...prev, toast],
      );
    },
    () => {
      void refetchOccupiedTableWaiters();
    },
  );

  const dismissToast = (id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };
  const handleNotificationSelect = (notification: ToastNotification) => {
    if (
      notification.relatedEntityType === "Order" &&
      notification.relatedEntityId
    ) {
      setActiveTab("ORDENES");
      setExpandedOrderId(String(notification.relatedEntityId));
    }
  };

  // Recordamos qué notificaciones ya vio para que no reaparezcan en el contador.
  const handleOpenNotifications = () => {
    const seenThroughId = todaysNotifications.reduce(
      (maxId, item) => Math.max(maxId, item.id),
      lastSeenNotificationId ?? 0,
    );
    setLastSeenNotificationId(seenThroughId);
    setNotificationHistory((prev) =>
      prev.map((item) => ({ ...item, isRead: true })),
    );
    if (myUserId) {
      AsyncStorage.setItem(
        `${WAITER_LAST_NOTIFICATIONS_VIEWED_KEY}:${myUserId}`,
        String(seenThroughId),
      ).catch(() => {});
      notificationService.markAllAsRead(myUserId).catch(() => {});
    }
  };

  // "Limpiar" ahora sí las borra en el backend, para que no reaparezcan
  // al salir y volver a entrar a la pantalla.
  const handleClearNotifications = () => {
    const idsToDelete = notificationHistory.map((n) => n.id);
    setNotificationHistory([]);
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

  const handleTablePress = async (table: any) => {
    if (table.status === "Ocupada") {
      const orderForTable = activeOrders.find((o) => o.tableId === table.id);
      let assignment = occupiedTableWaiters.find(
        (item) => String(item.tableId) === String(table.id),
      );
      if (!assignment) {
        const refreshedAssignments = await refetchOccupiedTableWaiters();
        if (!refreshedAssignments) {
          showAppAlert(
            t.errorTitle || "Error",
            t.tableWaiterLoadError ||
              "No se pudo consultar quién atiende esta mesa. Revisa la conexión e inténtalo de nuevo.",
            [{ text: t.tableOccupiedCancel || "Entendido", style: "cancel" }],
          );
          return;
        }
        assignment = refreshedAssignments?.find(
          (item) => String(item.tableId) === String(table.id),
        );
      }
      const assignedEmployeeId =
        assignment?.employeeId ?? orderForTable?.employeeId ?? null;
      const assignedEmployeeName =
        assignment?.employeeName ?? orderForTable?.employeeName ?? null;
      const isMyOrder =
        assignedEmployeeId !== null && assignedEmployeeId === myEmployeeId;

      if (isMyOrder) {
        showAppAlert(
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
        const waiterName = assignedEmployeeName || t.otherWaiter;
        showAppAlert(
          t.tableUnavailableTitle,
          t.tableUnavailableMessage.replace("{waiter}", waiterName),
          [{ text: t.tableOccupiedCancel || "Entendido", style: "cancel" }],
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
      const pending = live.filter(
        (d) => d.status === OrderDetailStatus.Pending,
      );
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
      // Confirma cada plato antes de mandar el siguiente para que la última
      // confirmación pueda liberar la mesa al ver el pedido completo.
      for (const item of pendingItems) {
        await orderService.markDelivered(Number(item.cartId));
      }
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

  const handleUpdateItemNote = async (cartId: string, note: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToUpdate = orderItems.find((i) => i.cartId === cartId);
    if (!itemToUpdate) return false;

    const lockMessage = getKitchenLockMessage(itemToUpdate);
    if (lockMessage) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        lockMessage,
      );
      return false;
    }

    if (itemToUpdate.alreadySubmitted) {
      if (!activeOrderId) {
        showAppAlert(
          t.errorTitle || "Error",
          t.orderItemMissingOrder || "No se pudo identificar el pedido.",
        );
        return false;
      }
      try {
        const orderId = Number(activeOrderId);
        const freshOrder = await orderService.getById(orderId);
        const freshDetail = freshOrder.orderDetails.find(
          (detail) => detail.id === Number(cartId),
        );
        if (!freshDetail || freshDetail.status !== OrderDetailStatus.Pending) {
          await refetchOrders();
          showAppAlert(
            t.actionNotAllowedTitle || "Acción no permitida",
            t.orderItemNotPendingEdit ||
              "Este producto ya no está pendiente y no se puede modificar.",
          );
          return false;
        }

        await orderService.updateDetail(freshDetail.id, {
          quantity: freshDetail.quantity,
          notes: note || null,
        });
        await refetchOrders();
      } catch (err: any) {
        showAppAlert(
          t.errorTitle || "Error",
          err?.message ||
            t.orderItemSaveNoteError ||
            "No se pudo guardar la nota del producto.",
        );
        return false;
      }
    }

    setOrderItems((items) =>
      items.map((item) => (item.cartId === cartId ? { ...item, note } : item)),
    );
    return true;
  };
  // Bloquea las notas y anulaciones si cocina ya tomó el plato.
  // Devuelve el mensaje de alerta con el estado real, o null si se puede editar.
  const getKitchenLockMessage = (item: any): string | null => {
    if (item?.isDelivered || item?.status === "Delivered") {
      return (
        t.orderItemDeliveredLock ||
        "Este producto ya fue entregado y no se puede modificar."
      );
    }
    if (item?.status === "InPreparation") {
      return "Este plato ya está en preparación en cocina, no se puede modificar.";
    }
    if (item?.status === "Ready") {
      return "Este plato ya está listo en cocina, no se puede modificar.";
    }
    return null;
  };

  const handleRemoveItem = async (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToRemove = orderItems.find((i) => i.cartId === cartId);
    if (!itemToRemove) return;

    if (itemToRemove.isDelivered || itemToRemove.status === "Delivered") {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        t.actionNotAllowedRemoveMessage ||
          "No puedes eliminar un plato que ya fue entregado al cliente.",
      );
      return;
    }

    const lockMessage = getKitchenLockMessage(itemToRemove);
    if (lockMessage) {
      showAppAlert(
        t.actionNotAllowedTitle || "Acción no permitida",
        lockMessage,
      );
      return;
    }

    if (itemToRemove?.alreadySubmitted) {
      if (!activeOrderId) {
        showAppAlert(
          t.errorTitle || "Error",
          t.orderItemMissingOrder || "No se pudo identificar el pedido.",
        );
        return;
      }
      try {
        const orderId = Number(activeOrderId);
        const freshOrder = await orderService.getById(orderId);
        const freshDetail = freshOrder.orderDetails.find(
          (detail) => detail.id === Number(cartId),
        );
        if (!freshDetail || freshDetail.status !== OrderDetailStatus.Pending) {
          await refetchOrders();
          showAppAlert(
            t.actionNotAllowedTitle || "Acción no permitida",
            t.orderItemNotPendingCancel ||
              "Este producto ya no está pendiente y no se puede cancelar.",
          );
          return;
        }

        await orderService.voidDetail(
          freshDetail.id,
          t.orderItemVoidReason || "Quitado por el mesero",
        );
        await refetchOrders();
      } catch (err: any) {
        showAppAlert(
          t.errorTitle || "Error",
          err?.message ||
            t.orderItemCancelError ||
            "No se pudo cancelar el producto.",
        );
        return;
      }
    }

    const updated = orderItems.filter((item) => item.cartId !== cartId);
    setOrderItems(updated);
    if (updated.length === 0) setIsCartExpanded(false);
  };

  const toggleItemToGo = async (cartId: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const itemToToggle = orderItems.find((i) => i.cartId === cartId);
    if (!itemToToggle) return;

    const isToGo = !itemToToggle.isToGo;

    if (itemToToggle.alreadySubmitted) {
      const orderDetailId = Number(cartId);
      if (!Number.isInteger(orderDetailId) || orderDetailId <= 0) {
        showAppAlert(
          t.errorTitle || "Error",
          t.orderItemMissingDetail ||
            "No se pudo identificar el producto del pedido.",
        );
        return;
      }

      try {
        await orderService.updateDetailToGo(orderDetailId, isToGo);
        setOrderItems((items) =>
          items.map((item) =>
            item.cartId === cartId ? { ...item, isToGo } : item,
          ),
        );
        await refetchOrders();
      } catch (err: any) {
        showAppAlert(
          t.errorTitle || "Error",
          err?.message ||
            t.orderItemToGoError ||
            "No se pudo actualizar si el producto es para llevar.",
        );
      }
      return;
    }

    setOrderItems((items) =>
      items.map((i) => (i.cartId === cartId ? { ...i, isToGo } : i)),
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
      showAppAlert(t.errorTitle || "Error", t.invalidTableMessage);
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
      <NotificationToastContainer
        notifications={toasts}
        onDismiss={dismissToast}
        t={(key) => t[key] || key}
        colors={{
          surface: colors.surface,
          text: colors.text,
          mutedText: colors.mutedText,
          border: colors.border,
        }}
      />
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
          taxRate={branchSettings?.taxRate ?? 0}
        />
      ) : (
        <SafeAreaView
          edges={["top"]}
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <View
            style={[
              styles.mainHeader,
              windowWidth < 380 && {
                flexDirection: "column",
                alignItems: "stretch",
                gap: 10,
              },
              { paddingHorizontal: windowWidth < 380 ? 16 : 20 },
              { backgroundColor: colors.header, borderColor: colors.border },
            ]}
          >
            <View style={styles.headerTitlesBox}>
              <Text style={[styles.mainSubtitle, { color: colors.mutedText }]}>
                {employeeDisplayName}
              </Text>
            </View>

            <View
              style={{
                flexDirection: "row",
                gap: 8,
                alignItems: "center",
                justifyContent: "flex-end",
              }}
            >
              <NotificationCenter
                notifications={todaysNotifications}
                unreadCount={unreadCount}
                colors={{
                  background: colors.background,
                  surface: colors.surface,
                  elevated: colors.elevatedSurface,
                  text: colors.text,
                  muted: colors.mutedText,
                  border: colors.border,
                  accent: colors.accent,
                }}
                t={(key) => t[key] || key}
                onOpen={handleOpenNotifications}
                onClear={handleClearNotifications}
                onSelect={handleNotificationSelect}
              />
              <TouchableOpacity
                style={[
                  styles.toGoButton,
                  {
                    backgroundColor: colors.success,
                    shadowColor: colors.success,
                  },
                ]}
                onPress={handleStartToGoOrder}
              >
                <Ionicons name="bag-handle-outline" size={20} color="#FFF" />
                <Text style={styles.toGoButtonText} numberOfLines={1}>
                  {t.dashboardParaLlevar || "Para Llevar"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {soundNotifications && !soundEnabled && (
            <TouchableOpacity
              onPress={enableSound}
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                backgroundColor: `${colors.warning}22`,
                paddingVertical: 10,
              }}
            >
              <Ionicons
                name="volume-mute-outline"
                size={18}
                color={colors.warning}
              />
              <Text
                style={{
                  color: colors.warning,
                  fontWeight: "700",
                  textAlign: "center",
                  flexShrink: 1,
                }}
              >
                {t.soundEnablePrompt}
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
              style={[
                styles.tab,
                activeTab === "MESAS" && styles.activeTab,
                {
                  borderBottomColor:
                    activeTab === "MESAS" ? colors.accent : "transparent",
                },
              ]}
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
              style={[
                styles.tab,
                activeTab === "ORDENES" && styles.activeTab,
                {
                  borderBottomColor:
                    activeTab === "ORDENES" ? colors.accent : "transparent",
                },
              ]}
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
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              backgroundColor: colors.background,
            }}
          >
            {activeTab === "MESAS" ? (
              <TablesGridView
                tables={tables}
                handleTablePress={handleTablePress}
                occupiedTableWaiters={occupiedTableWaiters}
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
    </>
  );
};

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useWindowDimensions } from "react-native";
import { useBranchSettings } from "@/features/branches/hooks/useBranchSettings";
import { orderService, type OccupiedTableWaiter } from "@/features/orders";
import { showAppAlert } from "@/features/shared/services/alertEvents";
import { ToastNotification } from "@/features/shared/components/NotificationToast";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getEmployeeIdFromToken, getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { notificationService } from "@/features/notifications";
import { normalizeNotificationType } from "@/features/notifications/utils/notificationType";
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
import { deferEffect } from "@/features/shared/utils/deferEffect";
import { WAITER_LAST_NOTIFICATIONS_VIEWED_KEY, getTodayInColombiaKey, isFromColombiaDay } from "./waiter-dashboard-utils";

export function useWaiterDashboardData(){
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

  useEffect(() => deferEffect(() => {
    void refetchOccupiedTableWaiters();
  }), [refetchOccupiedTableWaiters]);
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reasonPrompt, setReasonPrompt] = useState<{
    title: string;
    action: (reason: string) => Promise<void>;
  } | null>(null);
  const [reasonText, setReasonText] = useState("");
  const [submittingReason, setSubmittingReason] = useState(false);
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

  const askForReason = (title: string, action: (reason: string) => Promise<void>) => {
    setReasonText("");
    setReasonPrompt({ title, action });
  };

  const submitReason = async () => {
    const reason = reasonText.trim();
    if (!reasonPrompt || reason.length < 3 || submittingReason) return;
    setSubmittingReason(true);
    try {
      await reasonPrompt.action(reason);
      setReasonPrompt(null);
      setReasonText("");
    } catch (error: any) {
      showAppAlert(t.errorTitle || "Error", error?.message || t.orderItemCancelError || "No se pudo completar la acción.");
    } finally {
      setSubmittingReason(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(
      () => setTodayKey(getTodayInColombiaKey(new Date())),
      60_000,
    );
    return () => clearInterval(timer);
  }, []);

  useEffect(() => deferEffect(() => {
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
  }), [myUserId]);

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

  useEffect(() => deferEffect(() => {
    setNotificationHistory((prev) =>
      prev.filter((item) => isFromColombiaDay(item.createdAt, todayKey)),
    );
    setToasts((prev) =>
      prev.filter((item) => isFromColombiaDay(item.createdAt, todayKey)),
    );
  }), [todayKey]);

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

  useEffect(() => deferEffect(() => {
    void loadNotificationHistory();
  }), [loadNotificationHistory]);

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

  const [activeTableForOrder, setActiveTableForOrder] = useState<any>(null);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(null);
  const [orderItems, setOrderItems] = useState<any[]>([]);
  const [isCartExpanded, setIsCartExpanded] = useState(false);
  const [destType, setDestType] = useState<"particular" | "mesa">("particular");
  const [linkedTableId, setLinkedTableId] = useState<string | null>(null);
  const [toGoCustomerName, setToGoCustomerName] = useState("");

return { windowWidth, colors, soundNotifications, t, user, employeeProfile, employeeDisplayName, myEmployeeId, myUserId, branchId, branchSettings, realTables, refetchTables, tables, activeTab, setActiveTab, activeOrders, refetchOrders, occupiedTableWaiters, setOccupiedTableWaiters, refetchOccupiedTableWaiters, expandedOrderId, setExpandedOrderId, reasonPrompt, setReasonPrompt, reasonText, setReasonText, submittingReason, setSubmittingReason, toasts, setToasts, notificationHistory, setNotificationHistory, todayKey, setTodayKey, lastSeenNotificationId, setLastSeenNotificationId, askForReason, submitReason, todaysNotifications, unreadCount, loadNotificationHistory, soundEnabled, enableSound, dismissToast, handleNotificationSelect, handleOpenNotifications, handleClearNotifications, activeTableForOrder, setActiveTableForOrder, activeOrderId, setActiveOrderId, orderItems, setOrderItems, isCartExpanded, setIsCartExpanded, destType, setDestType, linkedTableId, setLinkedTableId, toGoCustomerName, setToGoCustomerName };
}

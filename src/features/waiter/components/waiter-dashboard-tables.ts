import { LayoutAnimation } from "react-native";
import { orderService, OrderDetailStatus } from "@/features/orders";
import { showAppAlert } from "@/features/shared/services/alertEvents";

import type { useWaiterDashboardData } from "./waiter-dashboard-data";
export function useWaiterTableActions(data:ReturnType<typeof useWaiterDashboardData>){
const { t, myEmployeeId, refetchTables, tables, setActiveTab, activeOrders, refetchOrders, occupiedTableWaiters, refetchOccupiedTableWaiters, askForReason, setActiveTableForOrder, setActiveOrderId, setOrderItems, setIsCartExpanded, setDestType, setLinkedTableId, setToGoCustomerName }=data;
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

  const cancelOrderWithReason = async (orderToCancel: any, reason: string) => {
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
          reason,
        );
      } else {
        await Promise.all(
          pending.map((d) =>
            orderService.voidDetail(d.id, reason),
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

  const handleCancelOrder = (orderToCancel: any) => {
    askForReason(
      t.cancelReasonTitle || "Motivo de cancelación",
      (reason) => cancelOrderWithReason(orderToCancel, reason),
    );
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

return { handleTablePress, handleStartToGoOrder, handleAddMoreToOrder, cancelOrderWithReason, handleCancelOrder, handleDeliverOrder, handleMarkOrderReady };
}

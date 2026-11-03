import { LayoutAnimation } from "react-native";
import { orderService, OrderDetailStatus } from "@/features/orders";
import { showAppAlert } from "@/features/shared/services/alertEvents";

import type { useWaiterDashboardData } from "./waiter-dashboard-data";
export function useWaiterCartActions(data:ReturnType<typeof useWaiterDashboardData>){
const { t, refetchTables, setActiveTab, refetchOrders, askForReason, activeTableForOrder, setActiveTableForOrder, activeOrderId, setActiveOrderId, orderItems, setOrderItems, setIsCartExpanded }=data;
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
      askForReason(t.cancelReasonTitle || "Motivo de cancelación", async (reason) => {
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

          const liveDetails = freshOrder.orderDetails.filter(
            (detail) =>
              detail.status !== OrderDetailStatus.Voided &&
              detail.status !== OrderDetailStatus.Cancelled,
          );

          if (liveDetails.length === 1 && liveDetails[0].id === freshDetail.id) {
            await orderService.cancel(orderId, reason);
            await Promise.all([refetchOrders(), refetchTables()]);
            setActiveTableForOrder(null);
            setActiveOrderId(null);
            setOrderItems([]);
            setActiveTab("MESAS");
            return;
          }

          await orderService.voidDetail(freshDetail.id, reason);
          await refetchOrders();
          const updated = orderItems.filter((item) => item.cartId !== cartId);
          setOrderItems(updated);
          if (updated.length === 0) setIsCartExpanded(false);
        } catch (err: any) {
          showAppAlert(
            t.errorTitle || "Error",
            err?.message ||
              t.orderItemCancelError ||
              "No se pudo cancelar el producto.",
          );
        }
      });
      return;
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

return { handleAddItem, handleUpdateItemNote, getKitchenLockMessage, handleRemoveItem, toggleItemToGo };
}

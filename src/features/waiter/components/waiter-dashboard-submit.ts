import { orderService, OrderType, OrderStatus } from "@/features/orders";
import { showAppAlert } from "@/features/shared/services/alertEvents";

import type { useWaiterDashboardData } from "./waiter-dashboard-data";
export function useWaiterSubmit(data:ReturnType<typeof useWaiterDashboardData>){
const { t, branchId, refetchTables, setActiveTab, refetchOrders, activeTableForOrder, setActiveTableForOrder, activeOrderId, setActiveOrderId, orderItems, setOrderItems, destType, linkedTableId, toGoCustomerName, setToGoCustomerName }=data;
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
    let orderType = OrderType.DineIn;

    if (activeTableForOrder.isGlobalToGo) {
      orderType = OrderType.ToGo;
      if (destType === "particular") {
        finalTableId = null;
      } else {
        if (!linkedTableId)
          return showAppAlert(
            t.warningTitle || "Aviso",
            t.warningSelectTableMessage ||
              "Selecciona a qué mesa asignar este pedido.",
          );
        finalTableId = Number(linkedTableId);
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

return { handleSubmitOrder };
}

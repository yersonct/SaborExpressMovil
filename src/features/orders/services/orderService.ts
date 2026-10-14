import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { API_BASE_URL } from "@/config/api";
import { OrderStatus } from "../types/order.types";
import { ORDERS_ENDPOINTS, PUBLIC_KITCHEN_BOARD_URL } from "./orderEndpoints";
import type {
  CreateOrderPayload,
  CreateOrderDetailPayload,
  Order,
  OrderSummary,
  OrderDetailStatus,
  OccupiedTableWaiter,
} from "../types/order.types";

let occupiedTableWaiterEndpointUnavailable = false;

async function getOccupiedTableWaitersFromBranchOrders(
  branchId: number,
): Promise<OccupiedTableWaiter[]> {
  const response = await fetchAuthed(ORDERS_ENDPOINTS.byBranch(branchId));
  const orders = await handleResponse<OrderSummary[]>(response);
  const assignments = new Map<number, OccupiedTableWaiter>();

  [...orders]
    .sort(
      (first, second) =>
        new Date(second.createdAt).getTime() -
        new Date(first.createdAt).getTime(),
    )
    .forEach((order) => {
      if (
        order.tableId === null ||
        order.status === OrderStatus.Cancelled ||
        assignments.has(order.tableId)
      ) {
        return;
      }
      assignments.set(order.tableId, {
        tableId: order.tableId,
        employeeId: order.employeeId,
        employeeName: order.employeeName,
      });
    });

  return Array.from(assignments.values());
}

export const orderService = {
    create: async (payload: CreateOrderPayload): Promise<Order> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.create(), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      return handleResponse<Order>(res);
    },

    getById: async (id: number): Promise<Order> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.byId(id));
      return handleResponse<Order>(res);
    },

    getAll: async (branchId?: number): Promise<OrderSummary[]> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.getAll(branchId));
      return handleResponse<OrderSummary[]>(res);
    },

    getOccupiedTableWaiters: async (
      branchId: number,
    ): Promise<OccupiedTableWaiter[]> => {
      if (occupiedTableWaiterEndpointUnavailable) {
        return getOccupiedTableWaitersFromBranchOrders(branchId);
      }

      try {
        const res = await fetchAuthed(
          ORDERS_ENDPOINTS.occupiedTableWaiters(branchId),
        );
        return await handleResponse<OccupiedTableWaiter[]>(res);
      } catch (error: any) {
        if (error?.statusCode !== 404) throw error;

        // Compatible with a backend process that has not yet loaded the new,
        // minimal endpoint. The existing branch endpoint is also branch-scoped.
        occupiedTableWaiterEndpointUnavailable = true;
        return getOccupiedTableWaitersFromBranchOrders(branchId);
      }
    },

    getByCustomer: async (customerId: number): Promise<OrderSummary[]> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.byCustomer(customerId));
      return handleResponse<OrderSummary[]>(res);
    },

    // Sin login: para el monitor de cocina público (tablet/TV en pared)
    getPublicKitchenBoard: async (
      accessToken: string,
    ): Promise<OrderSummary[]> => {
      const res = await fetchAuthed(PUBLIC_KITCHEN_BOARD_URL(accessToken), {
        skipAuth: true,
      });
      return handleResponse<OrderSummary[]>(res);
    },

    updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.updateStatus(id), {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      return handleResponse<Order>(res);
    },

    // ⚠️ asumo que CancelOrderDto tiene un campo "reason" — si tu DTO usa otro
    // nombre (ej. "motivo"), cámbialo aquí.
    cancel: async (id: number, reason: string): Promise<Order> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.cancel(id), {
        method: "PATCH",
        body: JSON.stringify({ reason }),
      });
      return handleResponse<Order>(res);
    },

    // El cliente cancela su propio pedido (el back valida que no esté en preparación)
    cancelMine: async (id: number, reason?: string): Promise<Order> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.cancelMine(id), {
        method: "PATCH",
        body: JSON.stringify({ reason: reason ?? "Cancelado por el cliente" }),
      });
      return handleResponse<Order>(res);
    },

    // El cliente avisa que pagará en efectivo: el personal recibe aviso con sonido
    confirmCash: async (id: number): Promise<void> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.confirmCash(id), {
        method: "POST",
      });
      await handleResponse(res);
    },

    addDetail: async (
      orderId: number,
      payload: CreateOrderDetailPayload,
    ): Promise<void> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.addDetail(orderId), {
        method: "POST",
        body: JSON.stringify(payload),
      });
      await handleResponse(res);
    },

    addDetails: async (
      orderId: number,
      items: CreateOrderDetailPayload[],
    ): Promise<void> => {
      const res = await fetchAuthed(ORDERS_ENDPOINTS.addDetailsBatch(orderId), {
        method: "POST",
        body: JSON.stringify({ items }),
      });
      await handleResponse(res);
    },

    updateBatchStatus: async (
      orderId: number,
      batchNumber: number,
      status: OrderDetailStatus,
    ): Promise<void> => {
      const res = await fetchAuthed(
        ORDERS_ENDPOINTS.updateBatchStatus(orderId, batchNumber),
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      await handleResponse(res);
    },

    // Anula UNA línea del pedido (solo sirve mientras cocina no la tocó).
    voidDetail: async (orderDetailId: number, reason: string): Promise<void> => {
      const res = await fetchAuthed(
        `${API_BASE_URL}/api/order-details/${orderDetailId}/void`,
        {
          method: "PATCH",
          body: JSON.stringify({ reason }),
        },
      );
      await handleResponse(res);
    },

    updateDetail: async (
      orderDetailId: number,
      payload: { quantity: number; notes: string | null },
    ): Promise<void> => {
      const res = await fetchAuthed(
        `${API_BASE_URL}/api/order-details/${orderDetailId}`,
        {
          method: "PUT",
          body: JSON.stringify(payload),
        },
      );
      await handleResponse(res);
    },

    updateDetailToGo: async (
      orderDetailId: number,
      isToGo: boolean,
    ): Promise<void> => {
      const res = await fetchAuthed(
        `${API_BASE_URL}/api/order-details/${orderDetailId}/to-go`,
        {
          method: "PATCH",
          body: JSON.stringify({ isToGo }),
        },
      );
      await handleResponse(res);
    },

    markDelivered: async (orderDetailId: number): Promise<void> => {
      const res = await fetchAuthed(
        ORDERS_ENDPOINTS.markDelivered(orderDetailId),
        {
          method: "PATCH",
        },
      );
      await handleResponse(res);
    },
  };

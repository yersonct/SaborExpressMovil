  import { fetchAuthed } from "../../auth/services/apiClient";
  import { handleResponse } from "../../auth/services/handleResponse";
  import { API_BASE_URL } from "@/config/api";
import { ORDERS_ENDPOINTS, PUBLIC_KITCHEN_BOARD_URL } from "./orderEndpoints";
  import type {
    CreateOrderPayload,
    CreateOrderDetailPayload,
    Order,
    OrderSummary,
    OrderStatus,
    OrderDetailStatus,
  } from "../types/order.types";

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

import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { DELIVERIES_ENDPOINTS } from "./deliveryEndpoints";
import type {
  CustomerDeliveryTracking,
  Delivery,
  DeliveryStatus,
} from "../types/delivery.types";

export const deliveryService = {
  getByEmployee: async (deliveryPersonId: number): Promise<Delivery[]> => {
    const res = await fetchAuthed(
      DELIVERIES_ENDPOINTS.byEmployee(deliveryPersonId),
    );
    return handleResponse<Delivery[]>(res);
  },

  getByOrder: async (orderId: number): Promise<Delivery[]> => {
    const res = await fetchAuthed(DELIVERIES_ENDPOINTS.byOrder(orderId));
    return handleResponse<Delivery[]>(res);
  },

  getCustomerTracking: async (orderId: number): Promise<CustomerDeliveryTracking> => {
    const res = await fetchAuthed(DELIVERIES_ENDPOINTS.customerTracking(orderId));
    return handleResponse<CustomerDeliveryTracking>(res);
  },

  updateStatus: async (
    id: number,
    status: DeliveryStatus,
  ): Promise<Delivery> => {
    const res = await fetchAuthed(DELIVERIES_ENDPOINTS.updateStatus(id), {
      method: "PATCH",
      body: JSON.stringify({ status }),
    });
    return handleResponse<Delivery>(res);
  },

  rate: async (id: number, score: number, comment?: string): Promise<void> => {
    const res = await fetchAuthed(DELIVERIES_ENDPOINTS.rate(id), {
      method: "POST",
      body: JSON.stringify({ score, comment: comment?.trim() || null }),
    });
    await handleResponse(res);
  },
};

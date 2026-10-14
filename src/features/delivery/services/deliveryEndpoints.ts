import { API_BASE_URL } from "@/config/api";

const BASE_URL = `${API_BASE_URL}/api/Deliveries`;

export const DELIVERIES_ENDPOINTS = {
  byEmployee: (deliveryPersonId: number) =>
    `${BASE_URL}/employee/${deliveryPersonId}`,
  byOrder: (orderId: number) => `${BASE_URL}/order/${orderId}`,
  customerTracking: (orderId: number) =>
    `${BASE_URL}/customer/orders/${orderId}/tracking`,
  updateStatus: (id: number) => `${BASE_URL}/${id}/status`,
  rate: (id: number) => `${BASE_URL}/${id}/rating`,
} as const;

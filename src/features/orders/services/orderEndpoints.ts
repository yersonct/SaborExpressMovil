import { API_BASE_URL } from "@/config/api";


export const ORDERS_BASE_URL = `${API_BASE_URL}/api/Orders`;
const ORDER_DETAILS_BASE_URL = `${API_BASE_URL}/api/order-details`;

export const PUBLIC_KITCHEN_BOARD_URL = (accessToken: string) =>
  `${API_BASE_URL}/api/public/kitchen-board/token/${accessToken}`;

export const ORDERS_ENDPOINTS = {
  create: () => `${ORDERS_BASE_URL}`,
  byId: (id: number) => `${ORDERS_BASE_URL}/${id}`,
  byCustomer: (customerId: number) => `${ORDERS_BASE_URL}/customer/${customerId}`,
  getAll: (branchId?: number) => {
    const params = new URLSearchParams();
    if (branchId) params.set("branchId", String(branchId));
    const qs = params.toString();
    return `${ORDERS_BASE_URL}${qs ? `?${qs}` : ""}`;
  },
  occupiedTableWaiters: (branchId: number) =>
    `${ORDERS_BASE_URL}/branch/${branchId}/occupied-tables`,
  byBranch: (branchId: number) => `${ORDERS_BASE_URL}/branch/${branchId}`,
  cancel: (id: number) => `${ORDERS_BASE_URL}/${id}/cancel`,
  cancelMine: (id: number) => `${ORDERS_BASE_URL}/${id}/cancel-mine`,
  confirmCash: (id: number) => `${ORDERS_BASE_URL}/${id}/confirm-cash`,
  updateStatus: (id: number) => `${ORDERS_BASE_URL}/${id}/status`, // 👈 nuevo
  addDetail: (orderId: number) =>
    `${API_BASE_URL}/api/orders/${orderId}/details`,
  markDelivered: (orderDetailId: number) =>
    `${ORDER_DETAILS_BASE_URL}/${orderDetailId}/deliver`,

  addDetailsBatch: (orderId: number) =>
    `${API_BASE_URL}/api/orders/${orderId}/details/batch`,
  updateBatchStatus: (orderId: number, batchNumber: number) =>
    `${API_BASE_URL}/api/orders/${orderId}/details/batch/${batchNumber}/status`,
} as const;

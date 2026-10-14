import { API_BASE_URL } from "@/config/api";

const BASE_URL = `${API_BASE_URL}/api/Addresses`;

export const ADDRESSES_ENDPOINTS = {
  byCustomer: (customerId: number) => `${BASE_URL}/customer/${customerId}`,
  byId: (id: number) => `${BASE_URL}/${id}`,
  myDefault: `${BASE_URL}/me/default`, // NUEVO
  create: BASE_URL,
  update: (id: number) => `${BASE_URL}/${id}`,
  setDefault: (id: number) => `${BASE_URL}/${id}/default`,
  delete: (id: number) => `${BASE_URL}/${id}`,
} as const;

import { API_BASE_URL } from "@/config/api";
export const PRODUCTS_BASE_URL = `${API_BASE_URL}/api/Products`;

export const PRODUCTS_ENDPOINTS = {
  all: () => `${PRODUCTS_BASE_URL}`,
  byId: (id: number) => `${PRODUCTS_BASE_URL}/${id}`,
  byCategory: (categoryId: number) =>
    `${PRODUCTS_BASE_URL}/category/${categoryId}`,
} as const;

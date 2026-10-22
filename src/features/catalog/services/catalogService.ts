import { handleResponse } from "@/features/auth/services/handleResponse";
import type { Category, Product } from "../types/catalog.types";

import { API_BASE_URL as BASE_URL } from "@/config/api";

import { fetchAuthed } from "@/features/auth/services/apiClient";

const API_BASE_URL = `${BASE_URL}/api`;
export const SERVER_BASE_URL = BASE_URL;

export const catalogService = {
  getCategories: async (): Promise<Category[]> => {
    const res = await fetchAuthed(`${API_BASE_URL}/Categories`);
    return handleResponse<Category[]>(res);
  },

  // branchId opcional: si se pasa, el backend filtra productos de esa
  // sede + los globales (branchId null), igual que en la web.
  getProducts: async (branchId?: number | null): Promise<Product[]> => {
    const url = branchId
      ? `${API_BASE_URL}/Products?branchId=${branchId}`
      : `${API_BASE_URL}/Products`;
    const res = await fetchAuthed(url);
    return handleResponse<Product[]>(res);
  },
};

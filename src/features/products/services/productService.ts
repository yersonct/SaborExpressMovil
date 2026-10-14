import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { PRODUCTS_ENDPOINTS } from "./productEndpoints";
import type { Product } from "../types/product.types";

export const productService = {
  getAll: async (): Promise<Product[]> => {
    const res = await fetchAuthed(PRODUCTS_ENDPOINTS.all());
    return handleResponse<Product[]>(res);
  },

  getByCategory: async (categoryId: number): Promise<Product[]> => {
    const res = await fetchAuthed(PRODUCTS_ENDPOINTS.byCategory(categoryId));
    return handleResponse<Product[]>(res);
  },
};

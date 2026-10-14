import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import { handleResponse } from "@/features/auth/services/handleResponse";
import type {
  CustomerMe,
  UpdateCustomerMePayload,
} from "../types/customer.types";

const CUSTOMERS_BASE_URL = `${API_BASE_URL}/api/Customers`;

export const customerService = {
  getMe: async (): Promise<CustomerMe> => {
    const res = await fetchAuthed(`${CUSTOMERS_BASE_URL}/me`);
    return handleResponse<CustomerMe>(res);
  },

  updateMe: async (payload: UpdateCustomerMePayload): Promise<CustomerMe> => {
    const res = await fetchAuthed(`${CUSTOMERS_BASE_URL}/me`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleResponse<CustomerMe>(res);
  },
};

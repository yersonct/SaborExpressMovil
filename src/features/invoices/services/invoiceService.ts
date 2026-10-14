import { fetchAuthed } from "@/features/auth/services/apiClient";
import { handleResponse } from "@/features/auth/services/handleResponse";
import { API_BASE_URL } from "@/config/api";
import type { Invoice, CreateInvoicePayload } from "../types/invoice.types";

const INVOICES_BASE_URL = `${API_BASE_URL}/api/Invoices`;

export const invoiceService = {
  create: async (payload: CreateInvoicePayload): Promise<Invoice> => {
    const res = await fetchAuthed(INVOICES_BASE_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<Invoice>(res);
  },

  getByPayment: async (paymentId: number): Promise<Invoice> => {
    const res = await fetchAuthed(`${INVOICES_BASE_URL}/payment/${paymentId}`);
    return handleResponse<Invoice>(res);
  },

  getByOrder: async (orderId: number): Promise<Invoice[]> => {
    const res = await fetchAuthed(`${INVOICES_BASE_URL}/order/${orderId}`);
    return handleResponse<Invoice[]>(res);
  },
};

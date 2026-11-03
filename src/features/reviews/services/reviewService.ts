import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import { handleResponse } from "@/features/auth/services/handleResponse";
export interface OrderReview { id: number; orderId: number; rating: number; comment: string | null; }
export const reviewService = {
  async forCustomer(customerId: number): Promise<OrderReview[]> {
    return handleResponse<OrderReview[]>(await fetchAuthed(`${API_BASE_URL}/api/Reviews/customer/${customerId}`));
  },
  async create(orderId: number, rating: number, comment: string): Promise<OrderReview> {
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw new Error("La calificación debe estar entre 1 y 5");
    if (comment.trim().length > 500) throw new Error("El comentario debe tener máximo 500 caracteres.");
    return handleResponse<OrderReview>(await fetchAuthed(`${API_BASE_URL}/api/Reviews`, {
      method: "POST", body: JSON.stringify({ orderId, rating, comment: comment.trim() || null }),
    }));
  },
};

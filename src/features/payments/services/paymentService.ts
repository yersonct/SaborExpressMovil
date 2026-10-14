import { handleResponse } from "@/features/auth/services/handleResponse";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import type {
  Payment,
  CreatePaymentPayload,
  InitWompiPaymentPayload,
  WompiWidgetData,
  CashierShiftSummary,
} from "../types/payment.types";

import { API_BASE_URL } from "@/config/api";
const PAYMENTS_BASE_URL = `${API_BASE_URL}/api/Payments`;

export const paymentService = {
  // Pago en efectivo — se registra directo como completado
  create: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const res = await fetchAuthed(PAYMENTS_BASE_URL, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<Payment>(res);
  },

  // Inicia el pago con Wompi — devuelve los datos para armar el checkout
  initWompi: async (
    payload: InitWompiPaymentPayload,
  ): Promise<WompiWidgetData> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/wompi/init`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<WompiWidgetData>(res);
  },

  // Consulta el estado actual cuando SignalR avisa un cambio de Wompi.
  getById: async (id: number): Promise<Payment> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/${id}`);
    return handleResponse<Payment>(res);
  },

  // NUEVO — cierre de caja: solo lo que el cajero autenticado cobró hoy
  getMyShift: async (): Promise<CashierShiftSummary> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/my-shift`);
    return handleResponse<CashierShiftSummary>(res);
  },

  // NUEVO — pagos ya registrados de un pedido, para calcular el saldo
  // pendiente real antes de cobrar (evita mandar el total completo si
  // ya hubo un pago parcial/previo sobre el mismo pedido).
  getByOrder: async (orderId: number): Promise<Payment[]> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/order/${orderId}`);
    return handleResponse<Payment[]>(res);
  },

  // NUEVO — el cajero genera el cobro por QR (el back calcula el monto)
  initWompiCashier: async (payload: {
    orderId: number;
  }): Promise<WompiWidgetData> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/wompi/cashier-init`, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<WompiWidgetData>(res);
  },

  // NUEVO — pide al back que consulte a Wompi el estado real (respaldo del webhook)
  syncWompi: async (id: number): Promise<Payment> => {
    const res = await fetchAuthed(`${PAYMENTS_BASE_URL}/${id}/wompi-sync`, {
      method: "POST",
    });
    return handleResponse<Payment>(res);
  },
};

import { getToken } from "@/features/auth/services/tokenStorage";
import { handleResponse } from "@/features/auth/services/handleResponse";
import type {
  Payment,
  CreatePaymentPayload,
  InitWompiPaymentPayload,
  WompiWidgetData,
  CashierShiftSummary,
} from "../types/payment.types";

import { API_BASE_URL } from "@/config/api";
const PAYMENTS_BASE_URL = `${API_BASE_URL}/api/Payments`;

async function authHeaders() {
  const token = await getToken();
  return {
    "Content-Type": "application/json",
    Accept: "*/*",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export const paymentService = {
  // Pago en efectivo — se registra directo como completado
  create: async (payload: CreatePaymentPayload): Promise<Payment> => {
    const headers = await authHeaders();
    const res = await fetch(PAYMENTS_BASE_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<Payment>(res);
  },

  // Inicia el pago con Wompi — devuelve los datos para armar el checkout
  initWompi: async (
    payload: InitWompiPaymentPayload,
  ): Promise<WompiWidgetData> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/wompi/init`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<WompiWidgetData>(res);
  },

  // Consulta el estado actual de un pago (para hacer polling tras Wompi)
  getById: async (id: number): Promise<Payment> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/${id}`, { headers });
    return handleResponse<Payment>(res);
  },

  // NUEVO — cierre de caja: solo lo que el cajero autenticado cobró hoy
  getMyShift: async (): Promise<CashierShiftSummary> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/my-shift`, { headers });
    return handleResponse<CashierShiftSummary>(res);
  },

  // NUEVO — pagos ya registrados de un pedido, para calcular el saldo
  // pendiente real antes de cobrar (evita mandar el total completo si
  // ya hubo un pago parcial/previo sobre el mismo pedido).
  getByOrder: async (orderId: number): Promise<Payment[]> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/order/${orderId}`, { headers });
    return handleResponse<Payment[]>(res);
  },

  // NUEVO — el cajero genera el cobro por QR (el back calcula el monto)
  initWompiCashier: async (payload: {
    orderId: number;
  }): Promise<WompiWidgetData> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/wompi/cashier-init`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    });
    return handleResponse<WompiWidgetData>(res);
  },

  // NUEVO — pide al back que consulte a Wompi el estado real (respaldo del webhook)
  syncWompi: async (id: number): Promise<Payment> => {
    const headers = await authHeaders();
    const res = await fetch(`${PAYMENTS_BASE_URL}/${id}/wompi-sync`, {
      method: "POST",
      headers,
    });
    return handleResponse<Payment>(res);
  },
};

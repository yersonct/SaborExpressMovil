import { useCallback, useEffect, useRef, useState } from "react";
import { orderService } from "@/features/orders/services/orderService";
import { getToken } from "@/features/auth/services/tokenStorage";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import type { OrderSummary } from "@/features/orders/types/order.types";

const POLL_INTERVAL_MS = 20000;

// Todos los pedidos del cliente (más recientes primero), para el resumen
// y el historial del perfil.
export function useClientOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const token = await getToken();
      const customerId = token ? getCustomerIdFromToken(token) : null;
      if (!customerId) {
        setOrders([]);
        return;
      }
      const data = await orderService.getByCustomer(customerId);
      setOrders(
        [...data].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
      );
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar tus pedidos");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

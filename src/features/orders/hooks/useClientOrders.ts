import { useCallback, useEffect, useState } from "react";
import { orderService } from "@/features/orders/services/orderService";
import { getToken } from "@/features/auth/services/tokenStorage";
import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
import type { OrderSummary } from "@/features/orders/types/order.types";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";

// Todos los pedidos del cliente (más recientes primero), para el resumen
// y el historial del perfil.
export function useClientOrders() {
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
  }, [fetchOrders]);

  useRealtimeEvents(
    ["OrdersChanged", "DeliveriesChanged", "PaymentsChanged", "RealtimeConnected"],
    () => void fetchOrders(),
  );

  return { orders, loading, error, refetch: fetchOrders };
}

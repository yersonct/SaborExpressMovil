import { useCallback, useEffect, useRef, useState } from "react";
import { orderService } from "@/features/orders/services/orderService";
import {
  OrderStatus,
  OrderType,
  type OrderSummary,
} from "@/features/orders/types/order.types";
import type { Order as CashierOrder } from "../components/CashierData";

// Mismo patrón de polling que useActiveClientOrder / useWompiPolling.
const POLL_INTERVAL_MS = 15000;

// El cajero necesita ver el pedido incluso después de "Delivered" (servido),
// porque en Mesa/Para Llevar el pago suele cobrarse al final, no antes.
// Solo se excluyen los cancelados y los que ya están 100% pagados (verdad
// real del backend, vía OrderSummary.isFullyPaid). Si el negocio cobra
// ANTES de servir, cambia esta función para excluir también OrderStatus.Delivered.
function isActiveForCashier(order: OrderSummary): boolean {
  return order.status !== OrderStatus.Cancelled && !order.isFullyPaid;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("es-CO", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function mapToCashierOrder(order: OrderSummary): CashierOrder {
  return {
    id: String(order.id),
    type: order.orderType === OrderType.DineIn ? "mesa" : "llevar",
    table: order.tableNumber ?? undefined,
    customerName: order.customerName ?? undefined,
    employeeName: order.employeeName ?? undefined,
    items: order.orderDetails.length
      ? order.orderDetails
          .map((d) => {
            let base = `${d.quantity}x ${d.productName}`;
            // Igual que en cocina: si el producto es para llevar, el
            // cajero debe verlo aquí también, no solo cocina.
            if (d.isToGo) base += " 🛍️ (Para llevar)";
            return d.notes ? `${base} (Nota: ${d.notes})` : base;
          })
          .join("\n")
      : "Sin items registrados",
    total: order.total,
    status: "pendiente",
    time: formatTime(order.createdAt),
  };
}

export function useCashierOrders(branchId: number | null) {
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // IDs pagados en esta sesión: el backend aún no distingue "activo pero ya
  // pagado" de "activo y pendiente", así que el polling los seguiría trayendo
  // de vuelta. Los filtramos localmente hasta que el backend exponga el
  // estado de pago real en OrderSummary.
  const paidOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    try {
      const summaries = await orderService.getAll(branchId);
      const mesaYLlevar = summaries
        .filter(
          (o) =>
            (o.orderType === OrderType.DineIn ||
              o.orderType === OrderType.ToGo) &&
            isActiveForCashier(o) &&
            !paidOrderIdsRef.current.has(String(o.id)),
        )
        .map(mapToCashierOrder);
      setOrders(mesaYLlevar);
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar los pedidos");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  // Llamar justo después de registrar un pago exitoso: saca el pedido de la
  // lista al instante y evita que el próximo polling lo resucite.
  const markAsPaid = useCallback((orderId: string) => {
    paidOrderIdsRef.current.add(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  useEffect(() => {
    fetchOrders();
    intervalRef.current = setInterval(fetchOrders, POLL_INTERVAL_MS);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchOrders]);

  return { orders, setOrders, loading, error, refetch: fetchOrders, markAsPaid };
}

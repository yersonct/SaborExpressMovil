import { useCallback, useEffect, useState } from "react";
import { orderService } from "../services/orderService";
import { ACTIVE_ORDER_STATUSES, OrderDetailStatus } from "../types/order.types";

export interface WaiterOrderItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
  note: string;
  isToGo: boolean;
  isDelivered: boolean;
  status: OrderDetailStatus;
  cartId: string;
  alreadySubmitted: true;
}

export interface WaiterOrder {
  id: string;
  tableId: string;
  tableName: string;
  time: string;
  createdAt: string;
  status: string;
  total: number;
  items: WaiterOrderItem[];
  employeeId: number | null;
  employeeName: string | null;
  isFullyPaid: boolean;
}

export function useActiveOrders(branchId: number | null) {
  const [orders, setOrders] = useState<WaiterOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const summaries = await orderService.getAll(branchId);

      // Solo pedidos de HOY: uno de ayer que quedó sin cerrar (nunca se
      // marcó Delivered/Cancelled) seguía "activo" por estado y se colaba
      // en la lista del mesero como si fuera de hoy.
      const todayISO = new Date().toDateString();
      const activeSummaries = summaries.filter(
        (s) =>
          ACTIVE_ORDER_STATUSES.includes(s.status) &&
          new Date(s.createdAt).toDateString() === todayISO,
      );

      // 👇 Ya no hace falta un GET /api/Orders/{id} por cada pedido —
      // el backend ahora manda los items dentro de la misma lista.
  const mapped: WaiterOrder[] = activeSummaries.map((order) => ({
    id: String(order.id),
    tableId: order.tableId ? String(order.tableId) : `particular_${order.id}`,
    tableName: order.tableNumber ? `Mesa ${order.tableNumber}` : "Para Llevar",
    time: new Date(order.createdAt).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: order.createdAt,
    status: order.status,
    total: order.total,
    employeeId: order.employeeId ?? null,
    employeeName: order.employeeName ?? null,
    isFullyPaid: order.isFullyPaid,
    items: order.orderDetails
      .filter(  
        (d) =>
          d.status !== OrderDetailStatus.Voided &&
          d.status !== OrderDetailStatus.Cancelled,
      )
      .map((d) => ({
        id: d.productId,
        name: d.productName,
        quantity: d.quantity,
        price: d.unitPrice,
        note: d.notes ?? "",
        isToGo: d.isToGo,
        status: d.status,
        isDelivered: d.status === OrderDetailStatus.Delivered,
        cartId: String(d.id),
        alreadySubmitted: true as const,
      })),
  }));

      setOrders(mapped);
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar las órdenes activas");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
}

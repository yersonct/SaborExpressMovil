import { useCallback, useEffect, useState } from "react";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { orderService } from "../services/orderService";
import {
  ACTIVE_ORDER_STATUSES,
  OrderDetailStatus,
  OrderType,
} from "../types/order.types";
import {
  formatColombiaTime,
  isColombiaToday,
} from "@/features/shared/utils/colombia-date";

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
  orderType: OrderType;
  time: string;
  createdAt: string;
  status: string;
  total: number;
  subTotal: number;
  tax: number;
  taxRate: number;
  taxIncludedInPrice: boolean;
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
    setError(null);
    try {
      const summaries = await orderService.getAll(branchId);

      // Solo pedidos de HOY: uno de ayer que quedó sin cerrar (nunca se
      // marcó Delivered/Cancelled) seguía "activo" por estado y se colaba
      // en la lista del mesero como si fuera de hoy.
      const activeSummaries = summaries.filter(
        (s) =>
          ACTIVE_ORDER_STATUSES.includes(s.status) &&
          isColombiaToday(s.createdAt),
      );

      // 👇 Ya no hace falta un GET /api/Orders/{id} por cada pedido —
      // el backend ahora manda los items dentro de la misma lista.
  const mapped: WaiterOrder[] = activeSummaries.map((order) => ({
    id: String(order.id),
    tableId: order.tableId ? String(order.tableId) : `particular_${order.id}`,
    tableName: order.tableNumber
      ? `Mesa ${order.tableNumber}`
      : order.orderType === OrderType.ToGo
        ? order.customerName?.trim() || "Particular"
        : "Para Llevar",
    orderType: order.orderType,
    time: formatColombiaTime(order.createdAt, undefined, {
      hour: "2-digit",
      minute: "2-digit",
    }),
    createdAt: order.createdAt,
    status: order.status,
    total: order.total,
    subTotal: order.subTotal,
    tax: order.tax,
    taxRate: order.taxRate,
    taxIncludedInPrice: order.taxIncludedInPrice,
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

  useRealtimeEvents(
    ["OrdersChanged", "DeliveriesChanged", "PaymentsChanged", "RealtimeConnected"],
    () => void fetchOrders(),
  );

  return { orders, loading, error, refetch: fetchOrders };
}

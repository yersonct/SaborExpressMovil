import { useCallback, useEffect, useState } from "react";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
import { orderService } from "../services/orderService";
import { tableService } from "@/features/tables/services/tableService";
import {
  ACTIVE_ORDER_STATUSES,
  OrderDetailStatus,
  OrderType,
} from "../types/order.types";
import {
  formatColombiaTime,
  isColombiaToday,
} from "@/features/shared/utils/colombia-date";
import { deferEffect } from "@/features/shared/utils/deferEffect";

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
      const [summaries, tables] = await Promise.all([
        orderService.getAll(branchId),
        tableService.getByBranch(branchId),
      ]);

      // Mesas realmente ocupadas según el backend.
      const occupiedTables = new Map(
        tables
          .filter((table) => table.status === "Occupied")
          .map(
            (table) =>
              [Number(table.id), table.currentSessionId ?? null] as const,
          ),
      );

      // Identifica las mesas que ya tienen pedidos vinculados
      // correctamente a su sesión actual.
      const tablesWithValidSessionOrders = new Set(
        summaries
          .filter((order) => {
            if (order.tableId == null || order.tableSessionId == null) {
              return false;
            }

            const currentSessionId = occupiedTables.get(Number(order.tableId));

            return (
              currentSessionId != null &&
              String(currentSessionId).toLowerCase() ===
                String(order.tableSessionId).toLowerCase()
            );
          })
          .map((order) => Number(order.tableId)),
      );

      const activeSummaries = summaries.filter((order) => {
        if (!ACTIVE_ORDER_STATUSES.includes(order.status)) {
          return false;
        }

        // Pedidos sin mesa: conservar el filtro de hoy.
        if (order.tableId == null) {
          return isColombiaToday(order.createdAt);
        }

        const tableId = Number(order.tableId);

        // No mostrar pedidos asociados a mesas libres.
        if (!occupiedTables.has(tableId)) {
          return false;
        }

        const currentSessionId = occupiedTables.get(tableId);

        // Caso normal: pedido asociado a la sesión vigente.
        if (currentSessionId != null && order.tableSessionId != null) {
          return (
            String(currentSessionId).toLowerCase() ===
            String(order.tableSessionId).toLowerCase()
          );
        }

        // Si el pedido tiene una sesión diferente,
        // nunca mostrarlo como perteneciente a la actual.
        if (order.tableSessionId != null) {
          return false;
        }

        // Compatibilidad temporal con pedidos creados
        // sin TableSessionId.
        if (!isColombiaToday(order.createdAt)) {
          return false;
        }

        // Si ya existe una atención correctamente asociada,
        // no mezclar pedidos antiguos sin sesión.
        if (tablesWithValidSessionOrders.has(tableId)) {
          return false;
        }

        const activeDetails = order.orderDetails.filter(
          (detail) =>
            detail.status !== OrderDetailStatus.Voided &&
            detail.status !== OrderDetailStatus.Cancelled,
        );

        // Los pedidos sin productos no deben aparecer
        // como una atención activa.
        if (activeDetails.length === 0) {
          return false;
        }

        // No recuperar un pedido que ya está completamente
        // entregado y pagado.
        const allDelivered = activeDetails.every(
          (detail) => detail.status === OrderDetailStatus.Delivered,
        );

        if (order.isFullyPaid && allDelivered) {
          return false;
        }

        return true;
      });

      // 👇 Ya no hace falta un GET /api/Orders/{id} por cada pedido —
      // el backend ahora manda los items dentro de la misma lista.
      const mapped: WaiterOrder[] = activeSummaries.map((order) => ({
        id: String(order.id),
        tableId: order.tableId
          ? String(order.tableId)
          : `particular_${order.id}`,
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

  useEffect(() => deferEffect(() => {
    fetchOrders();
  }), [fetchOrders]);

useRealtimeEvents(
  [
    "OrdersChanged",
    "TablesChanged",
    "DeliveriesChanged",
    "PaymentsChanged",
    "RealtimeConnected",
  ],
  () => void fetchOrders(),
);

  return { orders, loading, error, refetch: fetchOrders };
}

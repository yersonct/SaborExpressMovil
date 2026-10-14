import { useCallback, useEffect, useRef, useState } from "react";
import { orderService } from "@/features/orders/services/orderService";
import {
  OrderStatus,
  OrderType,
  OrderDetailStatus,
  type OrderSummary,
} from "@/features/orders/types/order.types";
import type { Order as CashierOrder } from "../components/CashierData";
import { formatColombiaTime } from "@/features/shared/utils/colombia-date";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";

// El cajero necesita ver el pedido incluso después de "Delivered" (servido),
// porque en Mesa/Para Llevar el pago suele cobrarse al final, no antes.
// Solo se excluyen los cancelados y los que ya están 100% pagados (verdad
// real del backend, vía OrderSummary.isFullyPaid). Si el negocio cobra
// ANTES de servir, cambia esta función para excluir también OrderStatus.Delivered.
function isActiveForCashier(order: OrderSummary): boolean {
  return order.status !== OrderStatus.Cancelled && !order.isFullyPaid;
}

function isWaitingForTableRelease(order: OrderSummary): boolean {
  if (
    order.orderType !== OrderType.DineIn ||
    order.tableId == null ||
    order.status === OrderStatus.Cancelled ||
    order.status === OrderStatus.Delivered
  ) {
    return false;
  }

  const activeDetails = order.orderDetails.filter(
    (detail) =>
      detail.status !== OrderDetailStatus.Voided &&
      detail.status !== OrderDetailStatus.Cancelled,
  );

  return (
    !order.isFullyPaid ||
    activeDetails.length === 0 ||
    activeDetails.some((detail) => detail.status !== OrderDetailStatus.Delivered)
  );
}

function formatTime(iso: string): string {
  return formatColombiaTime(iso, "es-CO", {
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
    subTotal: order.subTotal,
    tax: order.tax,
    taxRate: order.taxRate,
    taxIncludedInPrice: order.taxIncludedInPrice,
    deliveryFee: order.deliveryFee,
    status: "pendiente",
    time: formatTime(order.createdAt),
  };
}

export function useCashierOrders(branchId: number | null) {
  const [orders, setOrders] = useState<CashierOrder[]>([]);
  const [paidOrdersAwaitingDelivery, setPaidOrdersAwaitingDelivery] =
    useState<OrderSummary[]>([]);
  const [paidOrders, setPaidOrders] = useState<OrderSummary[]>([]);
  const [tablesWithBlockingOrders, setTablesWithBlockingOrders] = useState<
    Set<number>
  >(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // IDs pagados en esta sesión: el backend aún no distingue "activo pero ya
  // pagado" de "activo y pendiente", así que una recarga los traería de
  // vuelta. Los filtramos localmente hasta que el backend exponga el
  // estado de pago real en OrderSummary.
  // Prevent a just-paid order from briefly returning before its server summary
  // reflects the payment. Paid orders still awaiting delivery appear separately.
  const paidOrderIdsRef = useRef<Set<string>>(new Set());

  const fetchOrders = useCallback(async () => {
    if (!branchId) {
      setOrders([]);
      setPaidOrdersAwaitingDelivery([]);
      setPaidOrders([]);
      setTablesWithBlockingOrders(new Set());
      setLoading(false);
      return;
    }
    try {
      const summaries = await orderService.getAll(branchId);
      setPaidOrders(
        summaries
          .filter(
            (order) =>
              order.isFullyPaid &&
              order.status !== OrderStatus.Cancelled &&
              (order.orderType === OrderType.DineIn ||
                order.orderType === OrderType.ToGo ||
                order.orderType === OrderType.Delivery),
          )
          .sort(
            (first, second) =>
              new Date(second.createdAt).getTime() -
              new Date(first.createdAt).getTime(),
          ),
      );
      const blockingTableOrders = summaries.filter(isWaitingForTableRelease);
      setTablesWithBlockingOrders(
        new Set(blockingTableOrders.map((order) => order.tableId!)),
      );
      setPaidOrdersAwaitingDelivery(
        blockingTableOrders.filter(
          (order) =>
            order.isFullyPaid &&
            order.orderDetails.some(
              (detail) =>
                detail.status !== OrderDetailStatus.Voided &&
                detail.status !== OrderDetailStatus.Cancelled &&
                detail.status !== OrderDetailStatus.Delivered,
            ),
        ),
      );
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
  // lista al instante mientras llega el evento de actualización.
  const markAsPaid = useCallback((orderId: string) => {
    paidOrderIdsRef.current.add(orderId);
    setOrders((prev) => prev.filter((o) => o.id !== orderId));
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useRealtimeEvents(
    ["OrdersChanged", "DeliveriesChanged", "PaymentsChanged", "RealtimeConnected"],
    () => void fetchOrders(),
  );

  return {
    orders,
    setOrders,
    loading,
    error,
    refetch: fetchOrders,
    markAsPaid,
    paidOrdersAwaitingDelivery,
    paidOrders,
    tablesWithBlockingOrders,
  };
}

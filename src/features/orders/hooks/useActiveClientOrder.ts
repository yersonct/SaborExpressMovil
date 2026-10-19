import { useCallback, useEffect, useState } from "react";
import { AppState } from "react-native";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";
  import { orderService } from "@/features/orders/services/orderService";
  import { deliveryService } from "@/features/delivery/services/deliveryService";
  import { getToken } from "@/features/auth/services/tokenStorage";
  import { getCustomerIdFromToken } from "@/features/auth/services/decodeToken";
  import {
    OrderStatus,
    OrderType,
    type OrderSummary,
  } from "@/features/orders/types/order.types";
  import {
    DeliveryStatus,
    type Delivery,
  } from "@/features/delivery/types/delivery.types";

  const ACTIVE_CLIENT_ORDER_STATUSES: OrderStatus[] = [
    OrderStatus.Pending,
    OrderStatus.Confirmed,
    OrderStatus.InPreparation,
    OrderStatus.Ready,
  ];

  export interface ActiveClientOrder {
    order: OrderSummary;
    delivery: Delivery | null;
    // 1 = Preparando, 2 = En camino, 3 = Entregado
    step: 1 | 2 | 3;
  }

  export function useActiveClientOrder() {
    const [activeOrder, setActiveOrder] = useState<ActiveClientOrder | null>(
      null,
    );
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchActiveOrder = useCallback(async () => {
      try {
        const token = await getToken();
        const customerId = token ? getCustomerIdFromToken(token) : null;

        // Empleados usando la app como cliente no tienen CustomerId en el token:
        // no hay forma de pedir GET /api/Orders/customer/{id}, así que no mostramos tracking.
        if (!customerId) {
          setActiveOrder(null);
          return;
        }

        const orders = await orderService.getByCustomer(customerId);
        // Si no existe otro pedido activo, mantener visible durante diez minutos
        // la última entrega completada, para que el cliente vea el tercer paso.
        const active = orders.find((o) =>
          ACTIVE_CLIENT_ORDER_STATUSES.includes(o.status),
        );
        const order = active ?? orders.find((o) =>
          o.orderType === OrderType.Delivery && o.status === OrderStatus.Delivered,
        );

        if (!order) {
          setActiveOrder(null);
          return;
        }

        let delivery: Delivery | null = null;
        if (order.orderType === OrderType.Delivery) {
          const deliveries = await deliveryService.getByOrder(order.id);
          delivery = deliveries[0] ?? null;
        }

        if (!active) {
          const completedAt = delivery?.deliveredAt
            ? new Date(delivery.deliveredAt).getTime()
            : NaN;
          if (delivery?.status !== DeliveryStatus.Delivered ||
              !Number.isFinite(completedAt) ||
              Date.now() - completedAt >= 10 * 60_000) {
            setActiveOrder(null);
            return;
          }
        }

        let step: 1 | 2 | 3 = 1;
        if (delivery?.status === DeliveryStatus.Delivered ||
            order.status === OrderStatus.Delivered) step = 3;
        else if (delivery?.status === DeliveryStatus.InTransit) step = 2;

        setActiveOrder({ order, delivery, step });
        setError(null);
      } catch (err: any) {
        setError(err?.message ?? "No se pudo cargar tu pedido en curso");
      } finally {
        setLoading(false);
      }
    }, []);

    useEffect(() => {
      void fetchActiveOrder();
      // Recuperación ante desconexiones de SignalR y suspensión de la app.
      const interval = setInterval(() => {
        if (AppState.currentState === "active") void fetchActiveOrder();
      }, 20_000);
      const subscription = AppState.addEventListener("change", (state) => {
        if (state === "active") void fetchActiveOrder();
      });
      return () => {
        clearInterval(interval);
        subscription.remove();
      };
    }, [fetchActiveOrder]);

    useRealtimeEvents(
      ["OrdersChanged", "DeliveriesChanged", "PaymentsChanged", "RealtimeConnected"],
      () => void fetchActiveOrder(),
    );

    return { activeOrder, loading, error, refetch: fetchActiveOrder };
  }

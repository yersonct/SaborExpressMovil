import { useCallback, useEffect, useState } from "react";
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
        const order = orders.find((o) =>
          ACTIVE_CLIENT_ORDER_STATUSES.includes(o.status),
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

        let step: 1 | 2 | 3 = 1;
        if (delivery?.status === DeliveryStatus.Delivered) step = 3;
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
    }, [fetchActiveOrder]);

    useRealtimeEvents(
      ["OrdersChanged", "DeliveriesChanged", "PaymentsChanged", "RealtimeConnected"],
      () => void fetchActiveOrder(),
    );

    return { activeOrder, loading, error, refetch: fetchActiveOrder };
  }

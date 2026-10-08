import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  TouchableOpacity,
} from "react-native";
import { orderService } from "@/features/orders/services/orderService";
import {
  OrderSummary,
  OrderDetailStatus,
  OrderStatus,
  OrderType,
  ACTIVE_ORDER_STATUSES,
} from "@/features/orders/types/order.types";
import { useMyBranch } from "@/features/employees/hooks/useMyBranch";
import { chefStyles, boardStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";
import PedidoCard from "./PedidoCard";

import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/features/auth/context/AuthContext";
import { useKitchenNotifications } from "@/features/shared/hooks/useKitchenNotifications";

// Un "lote" es la combinación de un pedido + un número de tanda enviada a cocina.
// Cada vez que el mesero agrega productos a una mesa ya en curso, nace un lote nuevo.
export interface KitchenBatch {
  orderId: number;
  batchNumber: number;
  tableNumber: number | null;
  orderType: string;
  employeeName: string | null;
  customerName: string | null;
  assignedDeliveryPersonName: string | null;
  createdAt: string;
  status: OrderDetailStatus;
  items: OrderSummary["orderDetails"];
}

const nextStatus = (status: OrderDetailStatus): OrderDetailStatus | null => {
  if (status === OrderDetailStatus.Pending)
    return OrderDetailStatus.InPreparation;
  if (status === OrderDetailStatus.InPreparation)
    return OrderDetailStatus.Ready;
  return null;
};

const COLUMNS: { status: OrderDetailStatus; label: string; color: string }[] = [
  {
    status: OrderDetailStatus.Pending,
    label: "Por preparar",
    color: "#f97316",
  },
  {
    status: OrderDetailStatus.InPreparation,
    label: "En preparación",
    color: "#3b82f6",
  },
  { status: OrderDetailStatus.Ready, label: "Listos", color: "#22c55e" },
];

const POLL_INTERVAL_MS = 15000;

// Agrupa los items de todos los pedidos en "lotes" (orderId + batchNumber).
// El estado del lote es el estado del primer item vivo (todos los items de
// un mismo lote avanzan juntos, así que comparten el mismo estado).
export function buildBatches(orders: OrderSummary[]): KitchenBatch[] {
  const batches = new Map<string, KitchenBatch>();
  const todayISO = new Date().toDateString();

  for (const order of orders) {
    // Los pedidos de clientes (domicilio / recoger) que siguen abiertos se
    // mantienen aunque sean de ayer: el cliente los ve activos y cocina también.
    // Lo demás (mesas, entregados) solo se muestra si es de hoy.
    const isToday = new Date(order.createdAt).toDateString() === todayISO;
    const isOpenCustomerOrder =
      (order.orderType === OrderType.Delivery ||
        order.orderType === OrderType.Pickup) &&
      ACTIVE_ORDER_STATUSES.includes(order.status);

    if (!isToday && !isOpenCustomerOrder) continue;

    // Domicilios sin confirmar: aún no los valida el cajero ni se ha pagado
    if (
      order.orderType === OrderType.Delivery &&
      order.status === OrderStatus.Pending
    )
      continue;

    // Solo los cancelados salen del tablero. Los ENTREGADOS se mantienen
    // (se muestran en "Listos" con el marcador "Entregado") — así cocina
    // conserva el historial del día hasta que cambie de turno, momento en
    // que el filtro de "todayISO" de arriba los saca solo automáticamente.
    if (order.status === OrderStatus.Cancelled)
      continue;

    for (const item of order.orderDetails) {
      if (item.status === "Voided" || item.status === "Cancelled")
        continue;

      const key = `${order.id}-${item.batchNumber}`;
      if (!batches.has(key)) {
        batches.set(key, {
          orderId: order.id,
          batchNumber: item.batchNumber,
          tableNumber: order.tableNumber,
          orderType: order.orderType,
          employeeName: order.employeeName,
          customerName: order.customerName,
          assignedDeliveryPersonName: order.assignedDeliveryPersonName,
          createdAt: order.createdAt,
          status: item.status,
          items: [],
        });
      }
      batches.get(key)!.items.push(item);
    }
  }

  return Array.from(batches.values());
}

export default function ChefOrders() {
  const { colors } = useChefTheme();
  const { branchId } = useMyBranch();
  const router = useRouter();
  const { handleLogout, user } = useAuth();

  // El auxiliar de cocina ve el mismo tablero, pero no puede avanzar estados.
  const canUpdateStatus = !user?.roles?.includes("AUXILIAR_COCINA");

  const onLogout = () => {
    handleLogout().then(() => router.replace("/"));
  };
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = useCallback(async () => {
    if (!branchId) return;
    const data = await orderService.getAll(branchId);
    setOrders(data);
  }, [branchId]);

  // Conecta al Hub para recibir el sonido de "pedido nuevo" Y refrescar el
  // tablero al instante. Antes solo sonaba y el pedido tardaba hasta 15s en
  // aparecer (esperaba al polling), por eso el sonido "se adelantaba".
  // Si el usuario conectado es Auxiliar, simplemente nunca le llegará esa
  // notificación (el backend no lo incluye como destinatario).
  const { soundEnabled, enableSound } = useKitchenNotifications((notification) => {
    if (notification.relatedEntityType === "Order") {
      loadOrders();
    }
  });

  useEffect(() => {
    (async () => {
      setLoading(true);
      await loadOrders();
      setLoading(false);
    })();

    const interval = setInterval(loadOrders, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  }, [loadOrders]);

  const avanzarEstado = async (batch: KitchenBatch) => {
    const next = nextStatus(batch.status);
    if (!next) return;
    try {
      await orderService.updateBatchStatus(
        batch.orderId,
        batch.batchNumber,
        next,
      );
      await loadOrders();
    } catch (err) {
      loadOrders();
    }
  };

  if (!branchId) {
    return (
      <View
        style={[
          chefStyles.wrapper,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <Text style={{ color: colors.text, marginBottom: 20 }}>
          No se pudo determinar la sede de este dispositivo.
        </Text>
        <TouchableOpacity
          onPress={onLogout}
          style={{
            flexDirection: "row",
            alignItems: "center",
            backgroundColor: colors.card,
            borderWidth: 1,
            borderColor: colors.border,
            paddingVertical: 10,
            paddingHorizontal: 20,
            borderRadius: 10,
          }}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.text} />
          <Text
            style={{ color: colors.text, marginLeft: 8, fontWeight: "600" }}
          >
            Cerrar sesión
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (loading) {
    return (
      <View
        style={[
          chefStyles.wrapper,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const batches = buildBatches(orders);

  return (
    <View style={[chefStyles.wrapper, { backgroundColor: colors.background }]}>
      <View
        style={[
          chefStyles.header,
          {
            backgroundColor: colors.header,
            borderBottomColor: colors.border,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          },
        ]}
      >
        <View>
          <Text style={[chefStyles.brandText, { color: colors.text }]}>
            SABOREXPRESS
          </Text>
          <Text style={[chefStyles.roleBadge, { color: colors.mutedText }]}>
            COCINA
          </Text>
        </View>

        <TouchableOpacity onPress={onLogout} style={{ padding: 8 }}>
          <Ionicons name="log-out-outline" size={24} color={colors.mutedText} />
        </TouchableOpacity>
      </View>

      {!soundEnabled && (
        <TouchableOpacity
          onPress={enableSound}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            backgroundColor: "#FEF3C7",
            paddingVertical: 10,
          }}
        >
          <Ionicons name="volume-mute-outline" size={18} color="#92400E" />
          <Text style={{ color: "#92400E", fontWeight: "700" }}>
            Toca aquí para activar el sonido de pedidos
          </Text>
        </TouchableOpacity>
      )}

      <View style={boardStyles.board}>
        {COLUMNS.map((col) => {
          // La columna "Listos" también acoge los ya ENTREGADOS (no se
          // crea una columna aparte, van junto a los Ready con su propio
          // marcador visual).
          const batchesColumna = batches.filter((b) =>
            col.status === OrderDetailStatus.Ready
              ? b.status === OrderDetailStatus.Ready ||
                b.status === OrderDetailStatus.Delivered
              : b.status === col.status,
          );
          return (
            <View
              key={col.status}
              style={[
                boardStyles.column,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View
                style={[
                  boardStyles.columnHeader,
                  { borderBottomColor: colors.border },
                ]}
              >
                <Text style={[boardStyles.columnTitle, { color: col.color }]}>
                  {col.label} · {batchesColumna.length}
                </Text>
              </View>
              <ScrollView
                contentContainerStyle={boardStyles.columnBody}
                refreshControl={
                  <RefreshControl
                    refreshing={refreshing}
                    onRefresh={onRefresh}
                  />
                }
              >
                {batchesColumna.length === 0 ? (
                  <View style={boardStyles.emptyColumn}>
                    <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                      Sin pedidos
                    </Text>
                  </View>
                ) : (
                  batchesColumna.map((batch) => (
                    <PedidoCard
                      key={`${batch.orderId}-${batch.batchNumber}`}
                      batch={batch}
                      onAvanzarEstado={avanzarEstado}
                      canUpdateStatus={canUpdateStatus}
                    />
                  ))
                )}
              </ScrollView>
            </View>
          );
        })}
      </View>
    </View>
  );
}

import React, { useCallback, useEffect, useState } from "react";
import { View, Text, ScrollView, ActivityIndicator } from "react-native";
import { orderService } from "@/features/orders/services/orderService";
import { OrderDetailStatus } from "@/features/orders/types/order.types";
import { chefStyles, boardStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";
import { buildBatches, KitchenBatch } from "./ChefOrders";

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

const getElapsedLabel = (createdAt: string) => {
  const minutes = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / 60000,
  );
  if (minutes < 1) return "recién";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  return `hace ${hours} h`;
};

// Tarjeta de solo lectura: mismo look que PedidoCard, pero sin modal ni botón.
function PedidoCardReadOnly({ batch }: { batch: KitchenBatch }) {
  const { colors } = useChefTheme();
  const STATUS_LABEL: Partial<Record<OrderDetailStatus, string>> = {
    [OrderDetailStatus.Pending]: "Por preparar",
    [OrderDetailStatus.InPreparation]: "En preparación",
    [OrderDetailStatus.Ready]: "Listo",
    [OrderDetailStatus.Delivered]: "Entregado",
  };
  const STATUS_COLOR: Partial<Record<OrderDetailStatus, string>> = {
    [OrderDetailStatus.Pending]: "#f97316",
    [OrderDetailStatus.InPreparation]: "#3b82f6",
    [OrderDetailStatus.Ready]: "#22c55e",
    [OrderDetailStatus.Delivered]: "#64748b",
  };
  const statusColor = STATUS_COLOR[batch.status] ?? colors.mutedText;

  return (
    <View
      style={[
        chefStyles.card,
        { backgroundColor: colors.background, borderColor: colors.border },
      ]}
    >
      <View style={chefStyles.cardHeaderRow}>
        <View>
          <Text style={[chefStyles.mesaBadge, { color: colors.text }]}>
            {batch.tableNumber
              ? `Mesa ${batch.tableNumber}`
              : batch.customerName || "Para llevar"}
          </Text>
          {!!batch.employeeName && (
            <Text style={[chefStyles.mesero, { color: colors.mutedText }]}>
              Mesero: {batch.employeeName}
            </Text>
          )}
          {batch.orderType === "Delivery" && (
            <Text
              style={[
                chefStyles.mesero,
                {
                  color: batch.assignedDeliveryPersonName
                    ? colors.mutedText
                    : "#EF4444",
                },
              ]}
            >
              🛵{" "}
              {batch.assignedDeliveryPersonName
                ? `Repartidor: ${batch.assignedDeliveryPersonName}`
                : "Sin repartidor asignado"}
            </Text>
          )}
        </View>
        <Text style={[chefStyles.infoValor, { color: colors.mutedText }]}>
          #{batch.orderId}
        </Text>
      </View>

      <View
        style={[
          chefStyles.estadoBadge,
          { backgroundColor: statusColor + "26" },
        ]}
      >
        <Text style={{ color: statusColor, fontSize: 12, fontWeight: "700" }}>
          {STATUS_LABEL[batch.status]}
        </Text>
      </View>

      <View style={chefStyles.tagTiempo}>
        <Text style={{ fontSize: 11, color: colors.mutedText }}>
          {new Date(batch.createdAt).toLocaleTimeString("es-CO", {
            hour: "2-digit",
            minute: "2-digit",
          })}{" "}
          · {getElapsedLabel(batch.createdAt)}
        </Text>
      </View>

      <View style={chefStyles.menuList}>
        {batch.items.map((item) => (
          <View key={item.id}>
            <View style={chefStyles.menuItemRow}>
              <View style={chefStyles.itemNombreRow}>
                <Text style={[chefStyles.cantidad, { color: colors.text }]}>
                  {item.quantity}x
                </Text>
                <Text style={[chefStyles.platillo, { color: colors.text }]}>
                  {item.productName}
                </Text>
              </View>
              {item.isToGo && (
                <Text
                  style={[
                    chefStyles.togoTag,
                    {
                      color: colors.accent ?? "#E61C24",
                      backgroundColor: (colors.accent ?? "#E61C24") + "1A",
                    },
                  ]}
                >
                  Para llevar
                </Text>
              )}
            </View>
            {!!item.notes && (
              <Text style={[chefStyles.nota, { color: colors.mutedText }]}>
                Nota: {item.notes}
              </Text>
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

export default function KitchenBoardPublic({
  accessToken,
}: {
  accessToken: string;
}) {
  const { colors } = useChefTheme();
  const [batches, setBatches] = useState<KitchenBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const orders = await orderService.getPublicKitchenBoard(accessToken);
      setBatches(buildBatches(orders));
      setError(null);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo cargar el tablero de cocina.");
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    load();
    const interval = setInterval(load, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [load]);

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

  if (error) {
    return (
      <View
        style={[
          chefStyles.wrapper,
          {
            backgroundColor: colors.background,
            justifyContent: "center",
            alignItems: "center",
            padding: 20,
          },
        ]}
      >
        <Text style={{ color: colors.text, textAlign: "center" }}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={[chefStyles.wrapper, { backgroundColor: colors.background }]}>
      <View
        style={[
          chefStyles.header,
          { backgroundColor: colors.header, borderBottomColor: colors.border },
        ]}
      >
        <View>
          <Text style={[chefStyles.brandText, { color: colors.text }]}>
            SABOREXPRESS
          </Text>
          <Text style={[chefStyles.roleBadge, { color: colors.mutedText }]}>
            MONITOR DE COCINA
          </Text>
        </View>
      </View>

      <View style={boardStyles.board}>
        {COLUMNS.map((col) => {
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
              <ScrollView contentContainerStyle={boardStyles.columnBody}>
                {batchesColumna.length === 0 ? (
                  <View style={boardStyles.emptyColumn}>
                    <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                      Sin pedidos
                    </Text>
                  </View>
                ) : (
                  batchesColumna.map((batch) => (
                    <PedidoCardReadOnly
                      key={`${batch.orderId}-${batch.batchNumber}`}
                      batch={batch}
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

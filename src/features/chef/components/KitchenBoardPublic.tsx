import React, { useCallback, useEffect, useState } from "react";
import { AppState, View, Text, ScrollView, ActivityIndicator } from "react-native";
import * as signalR from "@microsoft/signalr";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE_URL } from "@/config/api";
import { orderService } from "@/features/orders/services/orderService";
import { OrderDetailStatus } from "@/features/orders/types/order.types";
import { chefStyles, boardStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";
import { buildBatches, KitchenBatch } from "./ChefOrders";
import KitchenColumns from "./KitchenColumns";
import { formatColombiaTime } from "@/features/shared/utils/colombia-date";



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

      {batch.awaitingCashierConfirmation && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
            padding: 10,
            marginBottom: 8,
            borderRadius: 10,
            backgroundColor: "#FEF3C7",
            borderWidth: 1,
            borderColor: "#FCD34D",
          }}
        >
          <Ionicons name="lock-closed" size={16} color="#92400E" />
          <Text style={{ color: "#78350F", fontSize: 12, flex: 1 }}>
            Esperando confirmación de caja para iniciar la preparación.
          </Text>
        </View>
      )}

      <View style={chefStyles.tagTiempo}>
        <Text style={{ fontSize: 11, color: colors.mutedText }}>
          {formatColombiaTime(batch.createdAt, "es-CO", {
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
      // Si ya hay datos en pantalla, se conservan y se reintenta en el siguiente ciclo
      setBatches((prev) => {
        if (prev.length === 0) {
          setError(err?.message ?? "No se pudo cargar el tablero de cocina.");
        }
        return prev;
      });
    } finally {
      setLoading(false);
    }
  }, [accessToken]);

  useEffect(() => {
    let disposed = false;
    let starting = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/public-menu`, {
        withCredentials: false,
        headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      })
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: ({ previousRetryCount }) => {
          if (previousRetryCount === 0) return 0;
          if (previousRetryCount === 1) return 2000;
          if (previousRetryCount === 2) return 10000;
          return 30000;
        },
      })
      .configureLogging(signalR.LogLevel.None)
      .build();

    const refresh = () => {
      if (!disposed) void load();
    };
    const scheduleRetry = () => {
      if (disposed || retryTimer) return;
      retryTimer = setTimeout(() => {
        retryTimer = null;
        start();
      }, 5000);
    };
    const start = () => {
      if (
        disposed ||
        starting ||
        connection.state !== signalR.HubConnectionState.Disconnected
      ) return;
      starting = true;
      connection
        .start()
        .then(refresh)
        .catch(scheduleRetry)
        .finally(() => {
          starting = false;
        });
    };

    connection.on("KitchenBoardChanged", refresh);
    connection.onreconnected(refresh);
    connection.onclose(scheduleRetry);
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || disposed) return;
      if (connection.state === signalR.HubConnectionState.Disconnected) start();
      else refresh();
    });

    void load();
    start();
    return () => {
      disposed = true;
      if (retryTimer) clearTimeout(retryTimer);
      appStateSub.remove();
      connection.stop().catch(() => {});
    };
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

      <KitchenColumns
        batches={batches}
        renderCard={(batch) => <PedidoCardReadOnly batch={batch} />}
      />
    </View>
  );
}

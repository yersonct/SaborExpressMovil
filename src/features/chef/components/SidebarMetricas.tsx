import React from "react";
import { View, Text } from "react-native";
import { OrderSummary, OrderStatus } from "@/features/orders/types/order.types";
import { chefStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";

export default function SidebarMetricas({
  orders,
}: {
  orders: OrderSummary[];
}) {
  const { colors } = useChefTheme();
  const pendientes = orders.filter(
    (o) => o.status === OrderStatus.Confirmed,
  ).length;
  const enPreparacion = orders.filter(
    (o) => o.status === OrderStatus.InPreparation,
  ).length;
  const listos = orders.filter((o) => o.status === OrderStatus.Ready).length;

  return (
    <View style={chefStyles.sidebar}>
      <View
        style={[
          chefStyles.metricBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[chefStyles.metricLabel, { color: colors.mutedText }]}>
          Por preparar
        </Text>
        <Text style={[chefStyles.metricValue, { color: "#f97316" }]}>
          {pendientes}
        </Text>
      </View>
      <View
        style={[
          chefStyles.metricBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[chefStyles.metricLabel, { color: colors.mutedText }]}>
          En preparación
        </Text>
        <Text style={[chefStyles.metricValue, { color: "#3b82f6" }]}>
          {enPreparacion}
        </Text>
      </View>
      <View
        style={[
          chefStyles.metricBox,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        <Text style={[chefStyles.metricLabel, { color: colors.mutedText }]}>
          Listos
        </Text>
        <Text style={[chefStyles.metricValue, { color: "#22c55e" }]}>
          {listos}
        </Text>
      </View>
    </View>
  );
}

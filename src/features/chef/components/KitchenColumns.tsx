import React, { useEffect, useState } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useWindowDimensions,
} from "react-native";
import { OrderDetailStatus } from "@/features/orders/types/order.types";
import { boardStyles } from "./style/ChefStyles";
import { useChefTheme } from "../context/ChefThemeContext";
import { useAuth } from "@/features/auth/context/AuthContext";
import type { KitchenBatch } from "./ChefOrders";
import { getColombiaDayKey } from "@/features/shared/utils/colombia-date";
import { translateMobileCopy } from "../../../locales/mobileCopy";

const COLUMNS: {
  status: OrderDetailStatus;
  label: string;
  short: string;
  color: string;
}[] = [
  {
    status: OrderDetailStatus.Pending,
    label: "Por preparar",
    short: "Por preparar",
    color: "#f97316",
  },
  {
    status: OrderDetailStatus.InPreparation,
    label: "En preparación",
    short: "Preparando",
    color: "#3b82f6",
  },
  {
    status: OrderDetailStatus.Ready,
    label: "Listos",
    short: "Listos",
    color: "#22c55e",
  },
];

const WIDE_BREAKPOINT = 768;

interface Props {
  batches: KitchenBatch[];
  renderCard: (batch: KitchenBatch) => React.ReactNode;
  refreshControl?: React.ReactElement<any>;
}

export default function KitchenColumns({
  batches,
  renderCard,
  refreshControl,
}: Props) {
  const { colors } = useChefTheme();
  // El auxiliar conserva la vista de pedidos anteriores; el cocinero solo ve hoy.
  const { user } = useAuth();
  const isAuxiliary = user?.roles?.includes("AUXILIAR_COCINA") ?? false;
  const { width } = useWindowDimensions();
  const isWide = width >= WIDE_BREAKPOINT;
  const [activeStatus, setActiveStatus] = useRememberedUiState<OrderDetailStatus>(
    "chef:column", OrderDetailStatus.Pending,
    (v): v is OrderDetailStatus => v === OrderDetailStatus.Pending || v === OrderDetailStatus.InPreparation || v === OrderDetailStatus.Ready,
  );
  const [showOlderBatches, setShowOlderBatches] = useRememberedUiState<boolean>("chef:older", false);
  const [todayKey, setTodayKey] = useState(() => getColombiaDayKey());
  useEffect(() => {
    const timer = setInterval(() => setTodayKey(getColombiaDayKey()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const todayBatches = batches.filter((b) => getColombiaDayKey(b.createdAt) === todayKey);
  const olderBatches = batches.filter((b) => getColombiaDayKey(b.createdAt) !== todayKey);
  const displayedBatches = isAuxiliary && showOlderBatches ? olderBatches : todayBatches;
  const historyControl = isAuxiliary && (olderBatches.length > 0 || showOlderBatches) ? (
    <TouchableOpacity accessibilityRole="button"
      onPress={() => setShowOlderBatches((v) => !v)}
      style={{ padding: 10, backgroundColor: colors.header,
        borderBottomColor: colors.border, borderBottomWidth: 1 }}>
      <Text style={{ textAlign: "center", color: colors.text, fontWeight: "700" }}>
        {showOlderBatches
          ? translateMobileCopy("Volver a cocina de hoy")
          : translateMobileCopy("Ver pedidos anteriores abiertos ({{count}})", { count: olderBatches.length })}
      </Text>
    </TouchableOpacity>
  ) : null;

  // "Listos" también incluye los ya entregados
  const batchesOf = (status: OrderDetailStatus) =>
    displayedBatches.filter((b) =>
      status === OrderDetailStatus.Ready
        ? b.status === OrderDetailStatus.Ready ||
          b.status === OrderDetailStatus.Delivered
        : b.status === status,
    );

  const renderColumn = (col: (typeof COLUMNS)[number], showHeader: boolean) => {
    const list = batchesOf(col.status);
    return (
      <View
        key={col.status}
        style={[
          boardStyles.column,
          { backgroundColor: colors.card, borderColor: colors.border },
          { flex: 1, width: isWide ? undefined : "100%" },
        ]}
      >
        {showHeader && (
          <View
            style={[
              boardStyles.columnHeader,
              { borderBottomColor: colors.border },
            ]}
          >
            <Text style={[boardStyles.columnTitle, { color: col.color }]}>
              {col.label} · {list.length}
            </Text>
          </View>
        )}
        <ScrollView
          contentContainerStyle={boardStyles.columnBody}
          refreshControl={refreshControl}
        >
          {list.length === 0 ? (
            <View style={boardStyles.emptyColumn}>
              <Text style={{ color: colors.mutedText, fontSize: 12 }}>
                {translateMobileCopy("Sin pedidos")}
              </Text>
            </View>
          ) : (
            list.map((batch) => (
              <React.Fragment key={`${batch.orderId}-${batch.batchNumber}`}>
                {renderCard(batch)}
              </React.Fragment>
            ))
          )}
        </ScrollView>
      </View>
    );
  };

  // Pantalla ancha: 3 columnas lado a lado
  if (isWide) {
    return (
      <View style={{ flex: 1 }}>
        {historyControl}
        <View style={[boardStyles.board, { flex: 1, flexDirection: "row" }]} >
          {COLUMNS.map((col) => renderColumn(col, true))}
        </View>
      </View>
    );
  }

  // Celular: pestañas + una columna
  const activeCol =
    COLUMNS.find((c) => c.status === activeStatus) ?? COLUMNS[0];

  return (
    <View style={{ flex: 1 }}>
      {historyControl}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: colors.header,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
        }}
      >
        {COLUMNS.map((col) => {
          const selected = col.status === activeStatus;
          return (
            <TouchableOpacity
              key={col.status}
              onPress={() => setActiveStatus(col.status)}
              activeOpacity={0.8}
              style={{
                flex: 1,
                paddingVertical: 12,
                alignItems: "center",
                borderBottomWidth: 3,
                borderBottomColor: selected ? col.color : "transparent",
              }}
            >
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.8}
                style={{
                  fontSize: 13,
                  fontWeight: "700",
                  color: selected ? col.color : colors.mutedText,
                  paddingHorizontal: 4,
                }}
              >
                {col.short}
              </Text>
              <View
                style={{
                  marginTop: 4,
                  minWidth: 24,
                  paddingHorizontal: 8,
                  paddingVertical: 2,
                  borderRadius: 10,
                  alignItems: "center",
                  backgroundColor: selected ? col.color : colors.border,
                }}
              >
                <Text
                  style={{
                    fontSize: 12,
                    fontWeight: "700",
                    color: selected ? "#fff" : colors.mutedText,
                  }}
                >
                  {batchesOf(col.status).length}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flex: 1, padding: 8 }}>
        {renderColumn(activeCol, false)}
      </View>
    </View>
  );
}

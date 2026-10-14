import React from "react";
import { Text, View } from "react-native";
import { getBreakdownLabels } from "../utils/orderBreakdown";

type Props = {
  subTotal: number;
  tax: number;
  taxRate: number;
  taxIncludedInPrice?: boolean;
  deliveryFee: number;
  lang?: string;
  locale?: string;
  textColor?: string;
  mutedColor?: string;
};

// Muestra el impuesto desglosado como información; el total lo pone cada pantalla.
export function BreakdownRows({
  subTotal,
  tax,
  taxRate,
  taxIncludedInPrice = false,
  deliveryFee,
  lang,
  locale = "es-CO",
  textColor = "#1E293B",
  mutedColor = "#64748B",
}: Props) {
  const l = getBreakdownLabels(lang);
  const fmt = (n: number) => `$${Math.round(n).toLocaleString(locale)}`;
  const row = (label: string, value: string) => (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        marginBottom: 4,
      }}
    >
      <Text style={{ color: mutedColor }}>{label}</Text>
      <Text style={{ color: textColor, fontWeight: "600" }}>{value}</Text>
    </View>
  );
  return (
    <View style={{ marginBottom: 8 }}>
      {row(l.subtotal, fmt(subTotal))}
      {tax > 0 &&
        row(
          `${taxIncludedInPrice ? l.taxIncluded : l.taxLegacy}${taxRate > 0 ? ` (${taxRate}%)` : ""}`,
          fmt(tax),
        )}
      {deliveryFee > 0 && row(l.delivery, fmt(deliveryFee))}
    </View>
  );
}

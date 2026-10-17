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
  // Usar la tasa y el precio final para el impuesto incluido. La columna
  // tax recibida puede proceder de pedidos creados antes de corregir el backend.
  const inclusiveTax = taxIncludedInPrice && taxRate > 0
    ? Math.round(((subTotal * taxRate) / (100 + taxRate)) * 100) / 100
    : 0;
  const displayedTax = taxIncludedInPrice ? inclusiveTax : tax;
  const taxBase = subTotal - inclusiveTax;
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
      {taxIncludedInPrice && taxRate > 0 && row(l.taxBase, fmt(taxBase))}
      {displayedTax > 0 &&
        row(
          `${taxIncludedInPrice ? l.taxIncluded : l.taxLegacy}${taxRate > 0 ? ` (${taxRate}%)` : ""}`,
          fmt(displayedTax),
        )}
      {deliveryFee > 0 && row(l.delivery, fmt(deliveryFee))}
    </View>
  );
}

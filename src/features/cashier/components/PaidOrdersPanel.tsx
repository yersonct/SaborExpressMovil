import React, { useCallback, useMemo, useState } from "react";
import { useRememberedUiState } from "@/features/shared/hooks/useRememberedUiState";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  OrderDetailStatus,
  OrderType,
  type OrderSummary,
} from "@/features/orders/types/order.types";
import { BreakdownRows } from "@/features/orders/components/BreakdownRows";
import {
  PaymentMethod,
  PaymentStatus,
} from "@/features/payments/types/payment.types";
import { paymentService } from "@/features/payments/services/paymentService";
import { invoiceService } from "@/features/invoices/services/invoiceService";
import { printInvoiceOrPdf } from "@/features/printer/pd01Service";
import type { Invoice } from "@/features/invoices/types/invoice.types";
import type { Order } from "./CashierData";
import { useCashierContext } from "../context/CashierContext";
import {
  TRANSLATIONS,
  type LanguageCode,
} from "@/locales/CashierTranslations";
import {
  COLOMBIA_TIME_ZONE,
  formatColombiaTime,
  getColombiaDayKey,
} from "@/features/shared/utils/colombia-date";

interface Props {
  orders: OrderSummary[];
  isDark: boolean;
  loading: boolean;
}

function isValidDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function shiftDateKey(value: string, days: number): string {
  const date = new Date(`${value}T12:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function formatPaidDate(value: string, locale: string): string {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, {
    timeZone: COLOMBIA_TIME_ZONE,
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function PaidOrdersPanel({ orders, isDark, loading }: Props) {
  const { language } = useCashierContext();
  const t = TRANSLATIONS[language as LanguageCode] || TRANSLATIONS.es;
  const [printingOrderId, setPrintingOrderId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useRememberedUiState<string>(
    "cashier:paid-date", getColombiaDayKey() ?? "",
    (v): v is string => typeof v === "string" && isValidDateKey(v) && v <= (getColombiaDayKey() ?? ""),
  );
  const [selectedOrder, setSelectedOrder] = useState<OrderSummary | null>(null);
  const today = getColombiaDayKey() ?? "";
  const validSelectedDate = isValidDateKey(selectedDate);
  const isHistoricalDate = validSelectedDate && selectedDate < today;
  const visibleOrders = useMemo(
    () =>
      validSelectedDate
        ? orders.filter(
            (order) =>
              getColombiaDayKey(order.paidAt ?? order.createdAt) === selectedDate,
          )
        : [],
    [orders, selectedDate, validSelectedDate],
  );
  const dateInputWebProps =
    Platform.OS === "web"
      ? ({ type: "date", max: today } as Record<string, string>)
      : {};
  const dateLocale =
    language === "es"
      ? "es-CO"
      : language === "pt"
        ? "pt-BR"
        : language === "fr"
          ? "fr-FR"
          : "en-US";

  const colors = useMemo(
    () => ({
      card: isDark ? "#111827" : "#FFFFFF",
      text: isDark ? "#F8FAFC" : "#1E293B",
      muted: isDark ? "#CBD5E1" : "#64748B",
      border: isDark ? "#334155" : "#E2E8F0",
      accent: isDark ? "#F87171" : "#E61C24",
      success: isDark ? "#34D399" : "#059669",
      successBackground: isDark ? "#123329" : "#ECFDF5",
    }),
    [isDark],
  );

  const printInvoice = useCallback(
    async (summary: OrderSummary) => {
      setPrintingOrderId(summary.id);
      try {
        const [payments, existingInvoices] = await Promise.all([
          paymentService.getByOrder(summary.id),
          invoiceService.getByOrder(summary.id),
        ]);
        const completedPayments = payments
          .filter((payment) => payment.status === PaymentStatus.Completed)
          .sort(
            (first, second) =>
              new Date(second.paidAt).getTime() -
              new Date(first.paidAt).getTime(),
          );
        const invoices = existingInvoices
          .filter((invoice) => !invoice.isVoided)
          .sort(
            (first, second) =>
              new Date(second.issuedAt).getTime() -
              new Date(first.issuedAt).getTime(),
          );

        let invoice: Invoice | undefined = invoices[0];
        let payment = invoice
          ? completedPayments.find((item) => item.id === invoice?.paymentId)
          : completedPayments[0];

        if (!payment) {
          Alert.alert(t.errorTitle, t.paidOrderWithoutPayment);
          return;
        }

        if (!invoice) {
          try {
            invoice = await invoiceService.create({ paymentId: payment.id });
          } catch (createError) {
            // El cobro puede haber generado su factura en paralelo; vuelve a
            // consultar para reutilizarla y evitar una factura duplicada.
            const latestInvoices = await invoiceService.getByOrder(summary.id);
            invoice = latestInvoices
              .filter((item) => !item.isVoided)
              .sort(
                (first, second) =>
                  new Date(second.issuedAt).getTime() -
                  new Date(first.issuedAt).getTime(),
              )[0];
            if (!invoice) throw createError;
            payment =
              completedPayments.find((item) => item.id === invoice?.paymentId) ??
              payment;
          }
        }

        const printableOrder: Order = {
          id: String(summary.id),
          type: summary.orderType === OrderType.DineIn ? "mesa" : "llevar",
          table: summary.tableNumber ?? undefined,
          customerName: summary.customerName ?? undefined,
          employeeName: summary.employeeName ?? undefined,
          items:
            summary.orderDetails
              .filter(
                (detail) =>
                  detail.status !== OrderDetailStatus.Voided &&
                  detail.status !== OrderDetailStatus.Cancelled,
              )
              .map(
                (detail) =>
                  `${detail.quantity}x ${detail.productName}${detail.notes ? ` (${detail.notes})` : ""}`,
              )
              .join("\n") || "—",
          total: summary.total,
          subTotal: summary.subTotal,
          tax: summary.tax,
          taxRate: summary.taxRate,
          taxIncludedInPrice: summary.taxIncludedInPrice,
          deliveryFee: summary.deliveryFee,
          status: "pagado",
          time: formatColombiaTime(summary.createdAt, "es-CO", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
        };

        const paymentMethodLabel =
          payment.method === PaymentMethod.Cash
            ? t.payCash
            : payment.method === PaymentMethod.Card
              ? t.payCard
              : payment.method === PaymentMethod.Transfer
                ? t.payTransfer
                : "Wompi";
        const orderTypeValue =
          summary.orderType === OrderType.DineIn
            ? t.orderTable.replace("{table}", String(summary.tableNumber ?? "—"))
            : summary.orderType === OrderType.Delivery
              ? t.tabDelivery
              : t.catalogTakeaway;

        await printInvoiceOrPdf(
          invoice,
          printableOrder,
          paymentMethodLabel,
          {
            title: t.invoicePdfTitle,
            invoiceNumber: t.invoicePdfNumberLabel,
            date: t.invoicePdfDateLabel,
            order: t.invoicePdfOrderLabel,
            customer: t.customer,
            orderType: t.orderTypeLabel,
            orderTypeValue,
            payment: t.paymentMethod,
            items: t.consumptionDetail,
            subtotal: t.invoicePdfSubtotalLabel,
            tax: t.invoicePdfTaxLabel,
            taxLegacy: t.invoicePdfLegacyTaxLabel,
            deliveryFee: t.deliveryFee.replace(/:\s*$/, ""),
            total: t.invoicePdfTotalLabel,
          },
        );
      } catch (error: any) {
        const message =
          error?.code === "NATIVE_PDF_MODULES_UNAVAILABLE"
            ? t.invoicePdfModuleUnavailable
            : t.invoicePdfOpenError.replace("{error}", error?.message ?? "");
        Alert.alert(t.errorTitle, message);
      } finally {
        setPrintingOrderId(null);
      }
    },
    [t],
  );

  return (
    <>
      <FlatList
        data={visibleOrders}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 12, flexGrow: 1 }}
        showsVerticalScrollIndicator
        ListHeaderComponent={
          <View style={{ gap: 9, marginBottom: 3 }}>
            <Text style={{ color: colors.muted, fontSize: 13 }}>
              {t.paidOrdersTitle} ({visibleOrders.length})
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {t.paidOrdersDateFilter}
            </Text>
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 8,
                flexWrap: "wrap",
              }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t.paidOrdersPreviousDay}
                onPress={() =>
                  setSelectedDate((current) =>
                    isValidDateKey(current) ? shiftDateKey(current, -1) : today,
                  )
                }
                style={{
                  width: 40,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                }}
              >
                <Ionicons name="chevron-back" size={19} color={colors.text} />
              </TouchableOpacity>
              <TextInput
                {...(dateInputWebProps as any)}
                accessibilityLabel={t.paidOrdersDateFilter}
                value={selectedDate}
                onChangeText={setSelectedDate}
                placeholder={t.paidOrdersDateHint}
                maxLength={10}
                keyboardType="numbers-and-punctuation"
                style={{
                  width: 158,
                  height: 42,
                  paddingHorizontal: 11,
                  borderWidth: 1,
                  borderColor: colors.border,
                  borderRadius: 10,
                  color: colors.text,
                  backgroundColor: colors.card,
                  fontSize: 14,
                }}
              />
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => setSelectedDate(today)}
                style={{
                  height: 42,
                  paddingHorizontal: 13,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  backgroundColor: isHistoricalDate ? "#2563EB" : colors.accent,
                }}
              >
                <Text style={{ color: "#FFFFFF", fontWeight: "700" }}>
                  {t.paidOrdersToday}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t.paidOrdersNextDay}
                disabled={!isValidDateKey(selectedDate) || selectedDate >= today}
                onPress={() =>
                  setSelectedDate((current) => shiftDateKey(current, 1))
                }
                style={{
                  width: 40,
                  height: 42,
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: colors.border,
                  backgroundColor: colors.card,
                  opacity: !isValidDateKey(selectedDate) || selectedDate >= today ? 0.45 : 1,
                }}
              >
                <Ionicons name="chevron-forward" size={19} color={colors.text} />
              </TouchableOpacity>
            </View>
            {!validSelectedDate && (
              <Text style={{ color: colors.accent, fontSize: 12 }}>
                {t.paidOrdersInvalidDate}
              </Text>
            )}
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <ActivityIndicator color={colors.accent} />
            </View>
          ) : (
            <View style={{ alignItems: "center", paddingVertical: 40 }}>
              <Ionicons name="receipt-outline" size={48} color={colors.muted} />
              <Text style={{ color: colors.muted, marginTop: 12, fontSize: 15 }}>
                {validSelectedDate ? t.paidOrdersNoResults : t.paidOrdersInvalidDate}
              </Text>
            </View>
          )
        }
        renderItem={({ item }) => {
          const orderTypeLabel =
            item.orderType === OrderType.DineIn
              ? t.orderTable.replace("{table}", String(item.tableNumber ?? "—"))
              : item.orderType === OrderType.Delivery
                ? t.tabDelivery
                : t.catalogTakeaway;
          const itemSummary = item.orderDetails
            .filter(
              (detail) =>
                detail.status !== OrderDetailStatus.Voided &&
                detail.status !== OrderDetailStatus.Cancelled,
            )
            .map((detail) => `${detail.quantity}x ${detail.productName}`)
            .join(" · ");

          return (
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 12,
                padding: 14,
                borderRadius: 14,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
              }}
            >
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t.paidOrdersOpenDetails}
                activeOpacity={0.75}
                onPress={() => setSelectedOrder(item)}
                style={{ flex: 1, minWidth: 0 }}
              >
                <Text
                  style={{ color: colors.text, fontWeight: "800", fontSize: 15 }}
                >
                  {t.orderNumber.replace("{id}", String(item.id))} · {orderTypeLabel}
                </Text>
                <Text
                  style={{ color: colors.muted, marginTop: 4, fontSize: 13 }}
                  numberOfLines={1}
                >
                  {item.customerName ?? t.customer} ·{" "}
                  {formatColombiaTime(item.createdAt, undefined, {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Text>
                <Text style={{ color: colors.muted, marginTop: 3, fontSize: 12 }}>
                  {t.paidOrdersPaidAt}: {formatPaidDate(item.paidAt ?? item.createdAt, dateLocale)}
                </Text>
                {!!itemSummary && (
                  <Text
                    style={{ color: colors.muted, marginTop: 6, fontSize: 13 }}
                    numberOfLines={2}
                  >
                    {itemSummary}
                  </Text>
                )}
                <View
                  style={{
                    alignSelf: "flex-start",
                    backgroundColor: colors.successBackground,
                    borderRadius: 20,
                    paddingHorizontal: 9,
                    paddingVertical: 4,
                    marginTop: 8,
                  }}
                >
                  <Text
                    style={{
                      color: colors.success,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {t.paidStatus}
                  </Text>
                </View>
              </TouchableOpacity>
              <View style={{ alignItems: "center", gap: 8 }}>
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                  ${item.total.toLocaleString("es-CO")}
                </Text>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t.printInvoice}
                  disabled={printingOrderId !== null}
                  onPress={() => void printInvoice(item)}
                  style={{
                    width: 42,
                    height: 42,
                    borderRadius: 21,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.accent,
                    opacity: printingOrderId !== null ? 0.65 : 1,
                  }}
                >
                  {printingOrderId === item.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="print-outline" size={20} color="#FFFFFF" />
                  )}
                </TouchableOpacity>
              </View>
            </View>
          );
        }}
      />

      <Modal
        visible={selectedOrder !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedOrder(null)}
      >
        {selectedOrder && (
          <View
            style={{
              flex: 1,
              justifyContent: "center",
              alignItems: "center",
              padding: 16,
              backgroundColor: "rgba(0,0,0,0.62)",
            }}
          >
            <View
              style={{
                width: "100%",
                maxWidth: 620,
                maxHeight: "90%",
                borderRadius: 18,
                overflow: "hidden",
                backgroundColor: colors.card,
                borderWidth: 1,
                borderColor: colors.border,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: 18,
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border,
                }}
              >
                <View style={{ flex: 1, minWidth: 0, paddingRight: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 19, fontWeight: "800" }}>
                    {t.paidOrdersDetails}
                  </Text>
                  <Text style={{ color: colors.muted, marginTop: 3 }}>
                    {t.orderNumber.replace("{id}", String(selectedOrder.id))}
                  </Text>
                </View>
                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel={t.cancel}
                  onPress={() => setSelectedOrder(null)}
                  style={{ padding: 7 }}
                >
                  <Ionicons name="close" size={24} color={colors.muted} />
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ padding: 18, gap: 15 }}>
                <View style={{ gap: 6 }}>
                  <Text style={{ color: colors.muted, fontSize: 13 }}>
                    {t.paidOrdersCreatedAt}: {formatPaidDate(selectedOrder.createdAt, dateLocale)}
                  </Text>
                  <Text style={{ color: colors.success, fontSize: 13, fontWeight: "700" }}>
                    {t.paidOrdersPaidAt}: {formatPaidDate(selectedOrder.paidAt ?? selectedOrder.createdAt, dateLocale)}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 14, fontWeight: "700" }}>
                    {selectedOrder.orderType === OrderType.DineIn
                      ? t.orderTable.replace("{table}", String(selectedOrder.tableNumber ?? "—"))
                      : selectedOrder.orderType === OrderType.Delivery
                        ? t.tabDelivery
                        : t.catalogTakeaway}
                  </Text>
                  {!!selectedOrder.customerName && (
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {t.customer}: {selectedOrder.customerName}
                    </Text>
                  )}
                  {!!selectedOrder.employeeName && (
                    <Text style={{ color: colors.muted, fontSize: 13 }}>
                      {t.takenBy.replace("{name}", selectedOrder.employeeName)}
                    </Text>
                  )}
                </View>

                <View style={{ height: 1, backgroundColor: colors.border }} />
                <Text style={{ color: colors.text, fontSize: 15, fontWeight: "800" }}>
                  {t.paidOrdersProducts}
                </Text>
                {selectedOrder.orderDetails
                  .filter(
                    (detail) =>
                      detail.status !== OrderDetailStatus.Voided &&
                      detail.status !== OrderDetailStatus.Cancelled,
                  )
                  .map((detail) => (
                    <View
                      key={detail.id}
                      style={{
                        flexDirection: "row",
                        alignItems: "flex-start",
                        justifyContent: "space-between",
                        gap: 12,
                      }}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: colors.text, fontSize: 14 }}>
                          {detail.quantity}x {detail.productName}
                        </Text>
                        {!!detail.notes && (
                          <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                            {detail.notes}
                          </Text>
                        )}
                      </View>
                      <Text style={{ color: colors.text, fontSize: 14 }}>
                        ${(detail.subTotal ?? detail.quantity * detail.unitPrice).toLocaleString("es-CO")}
                      </Text>
                    </View>
                  ))}

                <View style={{ height: 1, backgroundColor: colors.border, marginTop: 2 }} />
                <BreakdownRows
                  subTotal={selectedOrder.subTotal}
                  tax={selectedOrder.tax}
                  taxRate={selectedOrder.taxRate}
                  taxIncludedInPrice={selectedOrder.taxIncludedInPrice}
                  deliveryFee={selectedOrder.deliveryFee}
                  lang={language}
                  locale="es-CO"
                  textColor={colors.text}
                  mutedColor={colors.muted}
                />
                <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 12 }}>
                  <Text style={{ color: colors.text, fontSize: 16, fontWeight: "800" }}>
                    {t.totalToCharge}
                  </Text>
                  <Text style={{ color: colors.text, fontSize: 17, fontWeight: "800" }}>
                    ${selectedOrder.total.toLocaleString("es-CO")}
                  </Text>
                </View>
              </ScrollView>

              <View style={{ padding: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
                <TouchableOpacity
                  accessibilityRole="button"
                  disabled={printingOrderId !== null}
                  onPress={() => {
                    if (selectedOrder) void printInvoice(selectedOrder);
                  }}
                  style={{
                    minHeight: 46,
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    borderRadius: 12,
                    backgroundColor: colors.accent,
                    opacity: printingOrderId !== null ? 0.65 : 1,
                  }}
                >
                  {printingOrderId === selectedOrder.id ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Ionicons name="print-outline" size={18} color="#FFFFFF" />
                  )}
                  <Text style={{ color: "#FFFFFF", fontWeight: "800" }}>
                    {t.printInvoice}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </Modal>
    </>
  );
}

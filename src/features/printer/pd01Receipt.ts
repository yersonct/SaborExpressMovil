import type { Invoice } from "@/features/invoices/types/invoice.types";
import type { Order } from "@/features/cashier/components/CashierData";
import type { InvoicePdfLabels } from "@/features/invoices/services/invoicePdfTemplate";
import type { ApiLanguage } from "@/features/auth/services/apiLanguage";
import { PRINTER_SETTINGS_COPY } from "@/locales/PrinterSettingsTranslations";
import { GLYPHS } from "./pd01Font";

export const PD01_WIDTH = 384;
export type Pd01Row = Uint8Array;
const CHARS_PER_LINE = 32;
const FWIDTH = 6;
const FHEIGHT = 12;
const SCALE = 2;

const printable = (value: string) => value
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/ñ/gi, (m) => m === "ñ" ? "n" : "N")
  .replace(/[^\x20-\x7e]/g, "?");

export function buildReceiptLines(invoice: Invoice, order: Order, paymentMethod: string, labels: InvoicePdfLabels): string[] {
  const fmt = (v: number) => new Intl.NumberFormat(labels.locale || "es-CO", {
    style: "currency", currency: "COP", maximumFractionDigits: 0,
  }).format(Number(v || 0));
  const items = invoice.items?.length
    ? invoice.items.map((item) => ({
        name: `${item.name}${item.isToGo ? ` (${labels.takeaway})` : ""}${item.notes ? ` — ${item.notes}` : ""}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
    : order.receiptItems || [];
  const lines = [
    "           SABOREXPRESS",
    invoice.branchName || "SaborExpress",
    ...(invoice.branchAddress ? [`${labels.branchAddressLabel}: ${invoice.branchAddress}`] : []),
    ...(invoice.branchPhone ? [`${labels.branchPhone}: ${invoice.branchPhone}`] : []),
    "--------------------------------",
    labels.title,
    `${labels.invoiceNumber}: ${invoice.invoiceNumber}`,
    `${labels.date}: ${new Intl.DateTimeFormat(labels.locale || "es-CO", { timeZone: "America/Bogota", dateStyle: "short", timeStyle: "short" }).format(new Date(invoice.issuedAt))}`,
    `${labels.order}: #${invoice.orderId}`,
    ...(order.type === "mesa" ? [`${labels.table}: ${order.table ?? invoice.tableNumber ?? "—"}`] : []),
    `${labels.customer}: ${invoice.customerName || order.customerName || "—"}`,
    ...(invoice.customerDocument ? [`${labels.customerDocument}: ${invoice.customerDocument}`] : []),
    ...(invoice.customerEmail ? [`${labels.customerEmail}: ${invoice.customerEmail}`] : []),
    ...(invoice.deliveryAddressLine ? [`${labels.deliveryAddress}: ${invoice.deliveryAddressLine}`] : []),
    ...(invoice.deliveryAddressReference ? [`${labels.deliveryReference}: ${invoice.deliveryAddressReference}`] : []),
    ...(invoice.cashierName ? [`${labels.cashier}: ${invoice.cashierName}`] : []),
    `${labels.orderType}: ${labels.orderTypeValue}`,
    `${labels.payment}: ${paymentMethod}`,
    "--------------------------------",
    labels.items,
    ...items.flatMap((item) => [
      item.name,
      `${labels.quantity}: ${item.quantity} x ${fmt(item.unitPrice)}`,
      `${labels.itemTotal}: ${fmt(item.total ?? item.quantity * item.unitPrice)}`,
    ]),
    ...(!items.length ? (order.items?.split("\n").filter(Boolean) || []) : []),
    "--------------------------------",
    `${labels.subtotal}: ${fmt(invoice.subTotal)}`,
  ];
  if (invoice.tax > 0) {
    const taxLabel = invoice.taxIncludedInPrice ? labels.tax : labels.taxLegacy || labels.tax;
    lines.push(`${taxLabel}${invoice.taxRate > 0 ? ` (${invoice.taxRate}%)` : ""}: ${fmt(invoice.tax)}`);
  }
  if (invoice.deliveryFee > 0) lines.push(`${labels.deliveryFee || labels.orderType}: ${fmt(invoice.deliveryFee)}`);
  if (invoice.paymentAmount !== undefined && invoice.paymentAmount !== null) {
    lines.push(`${labels.paymentAmount}: ${fmt(invoice.paymentAmount)}`);
  }
  lines.push("--------------------------------", `${labels.total}: ${fmt(invoice.total)}`, "--------------------------------", labels.receiptNotice, labels.receiptFooter, "", "");
  return lines;
}

function wrapLine(line: string): string[] {
  const normalized = printable(line);
  if (normalized.length <= CHARS_PER_LINE) return [normalized];
  const parts: string[] = [];
  let remaining = normalized;
  while (remaining.length > CHARS_PER_LINE) {
    const idx = remaining.lastIndexOf(" ", CHARS_PER_LINE);
    const cut = idx > 10 ? idx : CHARS_PER_LINE;
    parts.push(remaining.slice(0, cut).trimEnd());
    remaining = remaining.slice(cut).trimStart();
  }
  parts.push(remaining);
  return parts;
}

// Cada fila son 48 bytes; PD01 utiliza el bit menos significativo como primer pixel.
export function receiptLinesToBitmap(lines: string[]): Pd01Row[] {
  const physicalLines = lines.flatMap(wrapLine);
  if (physicalLines.length > 150) throw new Error("El recibo es demasiado largo para la impresora.");
  const rows: Pd01Row[] = [];
  for (const text of physicalLines) {
    const rowCharacters = printable(text).padEnd(CHARS_PER_LINE, " ").slice(0, CHARS_PER_LINE);
    for (let y = 0; y < FHEIGHT * SCALE + 4; y++) {
      const bytes = new Uint8Array(PD01_WIDTH / 8);
      if (y < FHEIGHT * SCALE) {
        for (let column = 0; column < rowCharacters.length; column++) {
          const pattern = GLYPHS[rowCharacters[column]] || GLYPHS["?"];
          const bits = pattern[Math.floor(y / SCALE)] || 0;
          for (let x = 0; x < FWIDTH * SCALE; x++) {
            if (bits & (1 << Math.floor(x / SCALE))) {
              const px = column * FWIDTH * SCALE + x;
              bytes[px >> 3] |= 1 << (px & 7);
            }
          }
        }
      }
      rows.push(bytes);
    }
  }
  return rows;
}

export function buildPd01TestRows(language: ApiLanguage = "es"): Pd01Row[] {
  const copy = PRINTER_SETTINGS_COPY[language];
  return receiptLinesToBitmap(["SABOREXPRESS", copy.testHeading, copy.pd01Title, copy.connectedSuccess, "", ""]);
}

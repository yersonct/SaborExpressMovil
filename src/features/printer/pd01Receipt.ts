import type { Invoice } from "@/features/invoices/types/invoice.types";
import type { Order } from "@/features/cashier/components/CashierData";
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

export function buildReceiptLines(invoice: Invoice, order: Order, paymentMethod: string): string[] {
  const fmt = (v: number) => `$${Number(v || 0).toLocaleString("es-CO", {maximumFractionDigits: 0})}`;
  const lines = [
    "           SABOREXPRESS",
    invoice.branchName || "Sede SaborExpress",
    "--------------------------------",
    `FACTURA ${invoice.invoiceNumber}`,
    `Pedido #${invoice.orderId}`,
    new Date(invoice.issuedAt).toLocaleString("es-CO", { timeZone: "America/Bogota" }),
    `Cliente: ${invoice.customerName || order.customerName || "Consumidor final"}`,
    `Tipo: ${order.type === "mesa" ? `Mesa ${order.table || ""}` : "Para llevar"}`,
    `Pago: ${paymentMethod}`,
    "--------------------------------",
    "PRODUCTOS",
    ...(order.items?.split("\n").filter(Boolean) || []),
    "--------------------------------",
    `Subtotal productos: ${fmt(invoice.subTotal)}`,
  ];
  if (invoice.tax > 0) {
    const taxMode = invoice.taxIncludedInPrice ? "incluido" : "adicional";
    lines.push(`Impoconsumo ${taxMode} (${invoice.taxRate}%): ${fmt(invoice.tax)}`);
  }
  if (invoice.deliveryFee > 0) lines.push(`Domicilio: ${fmt(invoice.deliveryFee)}`);
  lines.push("--------------------------------", `TOTAL: ${fmt(invoice.total)}`, "--------------------------------", "Gracias por tu compra", "", "");
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

export function buildPd01TestRows(): Pd01Row[] {
  return receiptLinesToBitmap(["SABOREXPRESS", "PRUEBA DE IMPRESION", "Impresora PD01", "Bluetooth OK", "", ""]);
}

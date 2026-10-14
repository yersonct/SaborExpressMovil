import type { Order } from "@/features/cashier/components/CashierData";
import type { Invoice } from "../types/invoice.types";

export interface InvoicePdfLabels {
  title: string;
  invoiceNumber: string;
  date: string;
  order: string;
  customer: string;
  orderType: string;
  orderTypeValue: string;
  payment: string;
  items: string;
  subtotal: string;
  tax: string;
  taxLegacy?: string;
  deliveryFee?: string;
  total: string;
}

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const formatMoney = (amount: number) =>
  `$${amount.toLocaleString("es-CO", { maximumFractionDigits: 0 })}`;

export function buildInvoiceHtml(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
) {
  const date = new Date(invoice.issuedAt).toLocaleString();
  const itemLines = order.items
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => `<li>${escapeHtml(line)}</li>`)
    .join("");

  return `<!doctype html>
    <html lang="es">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <style>
          @page { size: A4; margin: 28px; }
          * { box-sizing: border-box; }
          body { color: #172033; font-family: Arial, sans-serif; margin: 0; }
          header { border-bottom: 3px solid #e61c24; padding-bottom: 16px; }
          h1 { font-size: 23px; margin: 0 0 10px; }
          .brand { color: #64748b; font-size: 12px; }
          .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 9px 20px; margin: 20px 0; }
          .label { color: #64748b; font-size: 11px; text-transform: uppercase; }
          .value { font-size: 14px; font-weight: 700; margin-top: 4px; }
          h2 { border-bottom: 1px solid #cbd5e1; font-size: 13px; margin: 22px 0 8px; padding-bottom: 8px; text-transform: uppercase; }
          ul { line-height: 1.6; margin: 0; padding-left: 20px; }
          .totals { margin: 20px 0 0 auto; max-width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { border-top: 1px solid #cbd5e1; color: #e61c24; font-size: 19px; font-weight: 700; margin-top: 6px; padding-top: 12px; }
          footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 10px; margin-top: 35px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(labels.title)}</h1>
          <div class="brand">${escapeHtml(invoice.branchName ?? "SaborExpress")}</div>
        </header>
        <section class="meta">
          <div><div class="label">${escapeHtml(labels.invoiceNumber)}</div><div class="value">${escapeHtml(invoice.invoiceNumber)}</div></div>
          <div><div class="label">${escapeHtml(labels.date)}</div><div class="value">${escapeHtml(date)}</div></div>
          <div><div class="label">${escapeHtml(labels.order)}</div><div class="value">#${escapeHtml(String(invoice.orderId))}</div></div>
          <div><div class="label">${escapeHtml(labels.customer)}</div><div class="value">${escapeHtml(invoice.customerName ?? order.customerName ?? "—")}</div></div>
          <div><div class="label">${escapeHtml(labels.orderType)}</div><div class="value">${escapeHtml(labels.orderTypeValue)}</div></div>
          <div><div class="label">${escapeHtml(labels.payment)}</div><div class="value">${escapeHtml(paymentMethod)}</div></div>
        </section>
        <h2>${escapeHtml(labels.items)}</h2>
        <ul>${itemLines}</ul>
        <section class="totals">
          <div class="total-row"><span>${escapeHtml(labels.subtotal)}</span><strong>${formatMoney(invoice.subTotal)}</strong></div>
          ${invoice.tax > 0 ? `<div class="total-row"><span>${escapeHtml(invoice.taxIncludedInPrice ? labels.tax : labels.taxLegacy ?? "Impuesto registrado")}${invoice.taxRate > 0 ? ` (${escapeHtml(String(invoice.taxRate))}%)` : ""}</span><strong>${formatMoney(invoice.tax)}</strong></div>` : ""}
          ${invoice.deliveryFee > 0 ? `<div class="total-row"><span>${escapeHtml(labels.deliveryFee ?? "Domicilio")}</span><strong>${formatMoney(invoice.deliveryFee)}</strong></div>` : ""}
          <div class="total-row grand-total"><span>${escapeHtml(labels.total)}</span><span>${formatMoney(invoice.total)}</span></div>
        </section>
        <footer>${escapeHtml(invoice.invoiceNumber)} · ${escapeHtml(date)}</footer>
      </body>
    </html>`;
}

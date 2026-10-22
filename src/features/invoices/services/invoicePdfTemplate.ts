import type { Order } from "@/features/cashier/components/CashierData";
import type { Invoice } from "../types/invoice.types";

export interface InvoicePdfLabels {
  title: string;
  invoiceNumber: string;
  date: string;
  order: string;
  customer: string;
  customerDocument: string;
  customerEmail: string;
  deliveryAddress: string;
  deliveryReference: string;
  branchAddressLabel: string;
  branchPhone: string;
  cashier: string;
  orderType: string;
  orderTypeValue: string;
  payment: string;
  items: string;
  quantity: string;
  unitPrice: string;
  itemTotal: string;
  takeaway: string;
  subtotal: string;
  tax: string;
  taxLegacy?: string;
  deliveryFee?: string;
  total: string;
  receiptNotice: string;
  receiptFooter: string;
  locale?: string;
  table: string;
  received: string;
  change: string;
  discount: string;
  paymentAmount: string;
  printBusyError: string;
  voidedError: string;
  invalidError: string;
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

const formatMoney = (amount: number, locale: string) =>
  new Intl.NumberFormat(locale, { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);

export function buildInvoiceHtml(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
) {
  const locale = labels.locale || "es-CO";
  const date = new Intl.DateTimeFormat(locale, {
    timeZone: "America/Bogota",
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(invoice.issuedAt));
  const receiptItems = invoice.items?.length
    ? invoice.items.map((item) => ({
        name: `${item.name}${item.isToGo ? ` (${labels.takeaway})` : ""}${item.notes ? ` — ${item.notes}` : ""}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
    : order.receiptItems || [];
  const itemRows = receiptItems.length
    ? receiptItems.map((item) => `<tr>
        <td>${escapeHtml(item.name)}</td>
        <td class="number">${escapeHtml(String(item.quantity))}</td>
        <td class="number">${formatMoney(item.unitPrice, locale)}</td>
        <td class="number">${formatMoney(item.total ?? item.unitPrice * item.quantity, locale)}</td>
      </tr>`).join("")
    : order.items.split("\n").map((line) => line.trim()).filter(Boolean)
      .map((line) => `<tr><td colspan="4">${escapeHtml(line)}</td></tr>`).join("");
  const customerName = invoice.customerName ?? order.customerName ?? "—";
  const branchName = invoice.branchName ?? "SaborExpress";

  return `<!doctype html>
    <html lang="${escapeHtml(locale.split("-")[0])}">
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
          table { border-collapse: collapse; width: 100%; }
          th, td { border-bottom: 1px solid #e2e8f0; padding: 8px 5px; text-align: left; vertical-align: top; }
          th { color: #64748b; font-size: 10px; text-transform: uppercase; }
          .number { text-align: right; white-space: nowrap; }
          .totals { margin: 20px 0 0 auto; max-width: 300px; }
          .total-row { display: flex; justify-content: space-between; padding: 5px 0; }
          .grand-total { border-top: 1px solid #cbd5e1; color: #e61c24; font-size: 19px; font-weight: 700; margin-top: 6px; padding-top: 12px; }
          footer { border-top: 1px solid #cbd5e1; color: #64748b; font-size: 10px; margin-top: 35px; padding-top: 10px; }
        </style>
      </head>
      <body>
        <header>
          <h1>${escapeHtml(labels.title)}</h1>
          <div class="brand">${escapeHtml(branchName)}</div>
          ${invoice.branchAddress ? `<div class="brand">${escapeHtml(labels.branchAddressLabel)}: ${escapeHtml(invoice.branchAddress)}</div>` : ""}
          ${invoice.branchPhone ? `<div class="brand">${escapeHtml(labels.branchPhone)}: ${escapeHtml(invoice.branchPhone)}</div>` : ""}
        </header>
        <section class="meta">
          <div><div class="label">${escapeHtml(labels.invoiceNumber)}</div><div class="value">${escapeHtml(invoice.invoiceNumber)}</div></div>
          <div><div class="label">${escapeHtml(labels.date)}</div><div class="value">${escapeHtml(date)}</div></div>
          <div><div class="label">${escapeHtml(labels.order)}</div><div class="value">#${escapeHtml(String(invoice.orderId))}</div></div>
          <div><div class="label">${escapeHtml(labels.customer)}</div><div class="value">${escapeHtml(customerName)}</div></div>
          ${invoice.customerDocument ? `<div><div class="label">${escapeHtml(labels.customerDocument)}</div><div class="value">${escapeHtml(invoice.customerDocument)}</div></div>` : ""}
          ${invoice.customerEmail ? `<div><div class="label">${escapeHtml(labels.customerEmail)}</div><div class="value">${escapeHtml(invoice.customerEmail)}</div></div>` : ""}
          ${invoice.deliveryAddressLine ? `<div><div class="label">${escapeHtml(labels.deliveryAddress)}</div><div class="value">${escapeHtml(invoice.deliveryAddressLine)}</div></div>` : ""}
          ${invoice.deliveryAddressReference ? `<div><div class="label">${escapeHtml(labels.deliveryReference)}</div><div class="value">${escapeHtml(invoice.deliveryAddressReference)}</div></div>` : ""}
          <div><div class="label">${escapeHtml(labels.orderType)}</div><div class="value">${escapeHtml(labels.orderTypeValue)}</div></div>
          <div><div class="label">${escapeHtml(labels.payment)}</div><div class="value">${escapeHtml(paymentMethod)}</div></div>
          ${invoice.cashierName ? `<div><div class="label">${escapeHtml(labels.cashier)}</div><div class="value">${escapeHtml(invoice.cashierName)}</div></div>` : ""}
        </section>
        <h2>${escapeHtml(labels.items)}</h2>
        <table><thead><tr><th>${escapeHtml(labels.items)}</th><th class="number">${escapeHtml(labels.quantity)}</th><th class="number">${escapeHtml(labels.unitPrice)}</th><th class="number">${escapeHtml(labels.itemTotal)}</th></tr></thead><tbody>${itemRows}</tbody></table>
        <section class="totals">
          <div class="total-row"><span>${escapeHtml(labels.subtotal)}</span><strong>${formatMoney(invoice.subTotal, locale)}</strong></div>
          ${invoice.tax > 0 ? `<div class="total-row"><span>${escapeHtml(invoice.taxIncludedInPrice ? labels.tax : labels.taxLegacy ?? labels.tax)}${invoice.taxRate > 0 ? ` (${escapeHtml(String(invoice.taxRate))}%)` : ""}</span><strong>${formatMoney(invoice.tax, locale)}</strong></div>` : ""}
          ${invoice.deliveryFee > 0 ? `<div class="total-row"><span>${escapeHtml(labels.deliveryFee ?? labels.orderType)}</span><strong>${formatMoney(invoice.deliveryFee, locale)}</strong></div>` : ""}
          ${invoice.paymentAmount !== undefined && invoice.paymentAmount !== null ? `<div class="total-row"><span>${escapeHtml(labels.paymentAmount)}</span><strong>${formatMoney(invoice.paymentAmount, locale)}</strong></div>` : ""}
          <div class="total-row grand-total"><span>${escapeHtml(labels.total)}</span><span>${formatMoney(invoice.total, locale)}</span></div>
        </section>
        <footer>${escapeHtml(labels.receiptNotice)}<br />${escapeHtml(labels.receiptFooter)}<br />${escapeHtml(invoice.invoiceNumber)} · ${escapeHtml(date)}</footer>
      </body>
    </html>`;
}

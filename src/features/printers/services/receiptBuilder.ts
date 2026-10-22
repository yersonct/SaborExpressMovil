import { CODEPAGE, EscPosBuilder } from '@ricka7x/expo-thermal-printer';
import type { PaperWidth, SalesReceipt } from '../types';
import type { ApiLanguage } from '@/features/auth/services/apiLanguage';
import { PRINTER_SETTINGS_COPY } from "@/locales/PrinterSettingsTranslations";

const money = (value: number): string =>
  `$${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('es-CO')}`;

// No permitir comandos de control inyectados por nombres/productos de la API.
const clean = (value: string): string => String(value || '').replace(/[\x00-\x1f\x7f]/g, ' ').trim();

function aligned(label: string, value: string, columns: number): string {
  const right = clean(value);
  const maxLeft = Math.max(0, columns - right.length - 1);
  const left = clean(label).slice(0, maxLeft);
  return (left + ' '.repeat(Math.max(1, columns - left.length - right.length)) + right).slice(0, columns);
}

export function buildTestReceipt(printerName: string, paperWidth: PaperWidth, language: ApiLanguage = 'es'): Uint8Array {
  const copy = PRINTER_SETTINGS_COPY[language];
  const columns = paperWidth === 80 ? 48 : 32;
  return new EscPosBuilder()
    .init().codepage(CODEPAGE.CP850)
    .align('center').bold(true).line('SABOREXPRESS').bold(false)
    .line(copy.testHeading)
    .line('-'.repeat(columns))
    .line(`${copy.paper}: ${paperWidth} mm`)
    .wrapped(clean(printerName), { columns })
    .line(copy.connectedSuccess)
    .line('á é í ó ú ñ Ñ')
    .line('-'.repeat(columns))
    .line(copy.thanks).feedToTear().build();
}

export function buildSalesReceipt(receipt: SalesReceipt, paperWidth: PaperWidth): Uint8Array {
  if (!receipt.receiptNumber || !receipt.businessName || !Array.isArray(receipt.items)) {
    throw new Error(receipt.labels.invalidReceipt);
  }
  if (!Number.isFinite(receipt.total) || receipt.total < 0 ||
      receipt.items.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 ||
         !Number.isFinite(item.unitPrice) || item.unitPrice < 0 ||
         (item.total !== undefined && (!Number.isFinite(item.total) || item.total < 0)))) {
    throw new Error(receipt.labels.invalidValues);
  }

  const columns = paperWidth === 80 ? 48 : 32;
  const b = new EscPosBuilder().init().codepage(CODEPAGE.CP850)
    .align('center').bold(true).wrapped(clean(receipt.businessName), { columns })
    .bold(false);

  if (receipt.branchName) b.wrapped(clean(receipt.branchName), { columns });
  if (receipt.branchAddress) b.wrapped(clean(receipt.branchAddress), { columns });
  if (receipt.branchPhone) b.wrapped(`${clean(receipt.labels.branchPhone)}: ${clean(receipt.branchPhone)}`, { columns });
  b.line(receipt.labels.title).line('='.repeat(columns)).align('left');
  b.wrapped(`${clean(receipt.labels.receiptNumber)}: ${clean(receipt.receiptNumber)}`, { columns });
  b.wrapped(`${clean(receipt.labels.date)}: ${clean(receipt.date)}`, { columns });
  if (receipt.orderNumber) b.wrapped(`${clean(receipt.labels.order)}: ${clean(receipt.orderNumber)}`, { columns });
  if (receipt.tableName) b.wrapped(`${clean(receipt.labels.table)}: ${clean(receipt.tableName)}`, { columns });
  if (receipt.customerName) b.wrapped(`${clean(receipt.labels.customer)}: ${clean(receipt.customerName)}`, { columns });
  if (receipt.customerDocument) b.wrapped(`${clean(receipt.labels.customerDocument)}: ${clean(receipt.customerDocument)}`, { columns });
  if (receipt.customerEmail) b.wrapped(`${clean(receipt.labels.customerEmail)}: ${clean(receipt.customerEmail)}`, { columns });
  if (receipt.deliveryAddressLine) b.wrapped(`${clean(receipt.labels.deliveryAddress)}: ${clean(receipt.deliveryAddressLine)}`, { columns });
  if (receipt.deliveryAddressReference) b.wrapped(`${clean(receipt.labels.deliveryReference)}: ${clean(receipt.deliveryAddressReference)}`, { columns });
  if (receipt.cashierName) b.wrapped(`${clean(receipt.labels.cashier)}: ${clean(receipt.cashierName)}`, { columns });
  b.wrapped(`${clean(receipt.labels.orderType)}: ${clean(receipt.labels.orderTypeValue)}`, { columns });
  b.line('-'.repeat(columns));

  for (const item of receipt.items) {
    b.wrapped(clean(item.name), { columns });
    const quantity = String(item.quantity);
    const rowTotal = money(item.total ?? item.quantity * item.unitPrice);
    b.wrapped(`${clean(receipt.labels.quantity)}: ${quantity} x ${clean(receipt.labels.unitPrice)}: ${money(item.unitPrice)}`, { columns });
    b.line(aligned(receipt.labels.itemTotal, rowTotal, columns));
  }

  b.line('-'.repeat(columns));
  b.line(aligned(receipt.labels.subtotal, money(receipt.subtotal), columns));
  if (receipt.discount !== undefined) b.line(aligned(receipt.labels.discount, money(receipt.discount), columns));
  if (receipt.tax !== undefined) {
    const taxLabel = receipt.taxLabel || `${receipt.labels.tax}${receipt.taxRate ? ` (${receipt.taxRate}%)` : ''}`;
    b.line(aligned(taxLabel, money(receipt.tax), columns));
  }
  if (receipt.deliveryFee !== undefined && receipt.deliveryFee > 0) {
    b.line(aligned(receipt.deliveryFeeLabel || receipt.labels.deliveryFee, money(receipt.deliveryFee), columns));
  }
  if (receipt.items.length === 0) {
    (receipt.itemLines || []).forEach((line) => b.wrapped(clean(line), { columns }));
  }
  b.bold(true).line(aligned(receipt.labels.total, money(receipt.total), columns)).bold(false);
  if (receipt.paymentMethod) b.wrapped(`${clean(receipt.labels.paymentMethod)}: ${clean(receipt.paymentMethod)}`, { columns });
  if (receipt.paidAmount !== undefined) b.line(aligned(receipt.labels.received, money(receipt.paidAmount), columns));
  if (receipt.change !== undefined) b.line(aligned(receipt.labels.change, money(receipt.change), columns));
  b.align('center').line('-'.repeat(columns));
  b.wrapped(clean(receipt.labels.notice), { columns });
  b.wrapped(clean(receipt.footer || ''), { columns });
  return b.feedToTear().build();
}

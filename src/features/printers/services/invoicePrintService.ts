import { Platform } from 'react-native';
import type { Invoice } from '@/features/invoices/types/invoice.types';
import { generateAndShareInvoicePdf } from '@/features/invoices/services/invoicePdfService';
import type { InvoicePdfLabels } from '@/features/invoices/services/invoicePdfTemplate';
import type { Order } from '@/features/cashier/components/CashierData';
import { loadPd01Printer } from '@/features/printer/pd01Prefs';
import { isPd01Available, sendPd01Bitmap } from '@/features/printer/pd01Ble';
import { buildReceiptLines, receiptLinesToBitmap } from '@/features/printer/pd01Receipt';
import { loadPrinterSelection, loadSavedPrinter, type PrinterSelection } from './printerStorage';
import { printSalesReceipt, printSalesReceiptToPrinter } from './printerService';
import type { PrinterDevice } from '@ricka7x/expo-thermal-printer';
import type { PaperWidth, SalesReceipt } from '../types';
import type { SavedPd01Printer } from '@/features/printer/pd01Prefs';

export type InvoicePrintTarget =
  | { kind: 'classic'; device: PrinterDevice }
  | { kind: 'pd01'; device: SavedPd01Printer }
  | { kind: 'pdf' };

let printingInvoice = false;

function busyError(message: string): Error {
  const error = new Error(message);
  Object.assign(error, { code: 'busy' });
  return error;
}

function createSalesReceipt(invoice: Invoice, order: Order, paymentMethod: string, labels: InvoicePdfLabels): SalesReceipt {
  const date = new Intl.DateTimeFormat(labels.locale || 'es-CO', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', hour12: true,
  }).format(new Date(invoice.issuedAt));

  const items = invoice.items?.length
    ? invoice.items.map((item) => ({
        name: `${item.name}${item.isToGo ? ` (${labels.takeaway})` : ''}${item.notes ? ` — ${item.notes}` : ''}`,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }))
    : (order.receiptItems || []).map((item) => ({
        name: item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.total,
      }));

  return {
    businessName: 'SaborExpress',
    receiptNumber: invoice.invoiceNumber,
    date,
    branchName: invoice.branchName || undefined,
    branchAddress: invoice.branchAddress || undefined,
    branchPhone: invoice.branchPhone || undefined,
    customerName: invoice.customerName || order.customerName || undefined,
    customerDocument: invoice.customerDocument || undefined,
    customerEmail: invoice.customerEmail || undefined,
    deliveryAddressLine: invoice.deliveryAddressLine || undefined,
    deliveryAddressReference: invoice.deliveryAddressReference || undefined,
    cashierName: invoice.cashierName || order.employeeName,
    orderNumber: String(invoice.orderId),
    tableName: order.type === 'mesa' ? String(order.table ?? invoice.tableNumber ?? '') || undefined : undefined,
    items,
    itemLines: order.items.split(/\r?\n/).filter(Boolean),
    subtotal: invoice.subTotal,
    tax: invoice.tax > 0 ? invoice.tax : undefined,
    taxRate: invoice.taxRate,
    taxIncludedInPrice: invoice.taxIncludedInPrice,
    taxLabel: `${invoice.taxIncludedInPrice ? labels.tax : labels.taxLegacy || labels.tax}${invoice.taxRate > 0 ? ` (${invoice.taxRate}%)` : ''}`,
    deliveryFee: invoice.deliveryFee,
    deliveryFeeLabel: labels.deliveryFee || labels.orderType,
    total: invoice.total,
    paymentMethod,
    paidAmount: invoice.paymentAmount ?? undefined,
    footer: labels.receiptFooter,
    labels: {
      title: labels.title,
      receiptNumber: labels.invoiceNumber,
      date: labels.date,
      order: labels.order,
      table: labels.table,
      customer: labels.customer,
      customerDocument: labels.customerDocument,
      customerEmail: labels.customerEmail,
      deliveryAddress: labels.deliveryAddress,
      deliveryReference: labels.deliveryReference,
      branchPhone: labels.branchPhone,
      cashier: labels.cashier,
      orderType: labels.orderType,
      orderTypeValue: labels.orderTypeValue,
      quantity: labels.quantity,
      unitPrice: labels.unitPrice,
      itemTotal: labels.itemTotal,
      subtotal: labels.subtotal,
      discount: labels.discount,
      paymentAmount: labels.paymentAmount,
      tax: labels.tax,
      deliveryFee: labels.deliveryFee || labels.orderType,
      total: labels.total,
      paymentMethod: labels.payment,
      received: labels.received,
      change: labels.change,
      takeaway: labels.takeaway,
      notice: labels.receiptNotice,
      invalidReceipt: labels.invalidError,
      invalidValues: labels.invalidError,
    },
  };
}

function hasPreferenceFor(selection: PrinterSelection | null, kind: PrinterSelection): boolean {
  return selection === kind;
}

/** Imprime una factura confirmada; al fallar Bluetooth abre el PDF como respaldo. */
export async function printInvoiceOrPdf(
  invoice: Invoice,
  order: Order,
  paymentMethod: string,
  labels: InvoicePdfLabels,
  target?: InvoicePrintTarget,
): Promise<void> {
  if (printingInvoice) throw busyError(labels.printBusyError);
  printingInvoice = true;
  try {
    if (invoice.isVoided) throw new Error(labels.voidedError);

    if (target?.kind === 'pdf') {
      await generateAndShareInvoicePdf(invoice, order, paymentMethod, labels);
      return;
    }

    if (target?.kind === 'classic') {
      const saved = await loadSavedPrinter().catch(() => null);
      await printSalesReceiptToPrinter(
        createSalesReceipt(invoice, order, paymentMethod, labels),
        target.device,
        (saved?.address === target.device.address ? saved.paperWidth : 58) as PaperWidth,
      );
      return;
    }

    if (target?.kind === 'pd01') {
      await sendPd01Bitmap(
        target.device.id,
        receiptLinesToBitmap(buildReceiptLines(invoice, order, paymentMethod, labels)),
      );
      return;
    }

    const [selection, classicPrinter] = await Promise.all([
      loadPrinterSelection().catch(() => null),
      Platform.OS === 'web' ? Promise.resolve(null) : loadSavedPrinter().catch(() => null),
    ]);
    const pd01Printer = Platform.OS === 'android' && isPd01Available()
      ? await loadPd01Printer().catch(() => null)
      : null;

    const selected: PrinterSelection | null =
      hasPreferenceFor(selection, 'classic') && classicPrinter ? 'classic'
        : hasPreferenceFor(selection, 'pd01') && pd01Printer ? 'pd01'
          // Las versiones anteriores imprimÃ­an facturas por PD01. MantÃ©n ese
          // flujo en instalaciones existentes hasta que el usuario elija otra.
          : pd01Printer ? 'pd01'
            : classicPrinter ? 'classic' : null;

    if (selected === 'classic' && classicPrinter) {
      try {
        await printSalesReceipt(createSalesReceipt(invoice, order, paymentMethod, labels));
        return;
      } catch {
        await generateAndShareInvoicePdf(invoice, order, paymentMethod, labels);
        return;
      }
    }

    if (selected === 'pd01' && pd01Printer) {
      try {
        await sendPd01Bitmap(
          pd01Printer.id,
          receiptLinesToBitmap(buildReceiptLines(invoice, order, paymentMethod, labels)),
        );
        return;
      } catch {
        await generateAndShareInvoicePdf(invoice, order, paymentMethod, labels);
        return;
      }
    }

    await generateAndShareInvoicePdf(invoice, order, paymentMethod, labels);
  } finally {
    printingInvoice = false;
  }
}

import { CODEPAGE, EscPosBuilder } from '@ricka7x/expo-thermal-printer';
import type { PaperWidth, SalesReceipt } from '../types';

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

export function buildTestReceipt(printerName: string, paperWidth: PaperWidth): Uint8Array {
  const columns = paperWidth === 80 ? 48 : 32;
  return new EscPosBuilder()
    .init().codepage(CODEPAGE.CP850)
    .align('center').bold(true).line('SABOREXPRESS').bold(false)
    .line('PRUEBA DE IMPRESION')
    .line('-'.repeat(columns))
    .line(`Papel: ${paperWidth} mm`)
    .wrapped(clean(printerName), { columns })
    .line('Conexion Bluetooth correcta')
    .line('á é í ó ú ñ Ñ')
    .line('-'.repeat(columns))
    .line('¡Gracias!').feedToTear().build();
}

export function buildSalesReceipt(receipt: SalesReceipt, paperWidth: PaperWidth): Uint8Array {
  if (!receipt.receiptNumber || !receipt.businessName || !Array.isArray(receipt.items)) {
    throw new Error('El comprobante no contiene la información obligatoria.');
  }
  if (!Number.isFinite(receipt.total) || receipt.total < 0 ||
      receipt.items.some(item => !Number.isFinite(item.quantity) || item.quantity <= 0 ||
         !Number.isFinite(item.unitPrice) || item.unitPrice < 0 ||
         (item.total !== undefined && (!Number.isFinite(item.total) || item.total < 0)))) {
    throw new Error('Hay valores no válidos en el comprobante.');
  }

  const columns = paperWidth === 80 ? 48 : 32;
  const b = new EscPosBuilder().init().codepage(CODEPAGE.CP850)
    .align('center').bold(true).wrapped(clean(receipt.businessName), { columns })
    .bold(false);

  if (receipt.branchName) b.wrapped(clean(receipt.branchName), { columns });
  b.line('COMPROBANTE DE PAGO').line('='.repeat(columns)).align('left');
  b.wrapped(`Recibo: ${clean(receipt.receiptNumber)}`, { columns });
  b.wrapped(`Fecha: ${clean(receipt.date)}`, { columns });
  if (receipt.orderNumber) b.wrapped(`Pedido: ${clean(receipt.orderNumber)}`, { columns });
  if (receipt.tableName) b.wrapped(`Mesa: ${clean(receipt.tableName)}`, { columns });
  if (receipt.cashierName) b.wrapped(`Cajero: ${clean(receipt.cashierName)}`, { columns });
  b.line('-'.repeat(columns));

  for (const item of receipt.items) {
    b.wrapped(clean(item.name), { columns });
    const quantity = String(item.quantity);
    const unit = `${quantity} x ${money(item.unitPrice)}`;
    const rowTotal = money(item.total ?? item.quantity * item.unitPrice);
    b.line(aligned(unit, rowTotal, columns));
  }

  b.line('-'.repeat(columns));
  b.line(aligned('Subtotal', money(receipt.subtotal), columns));
  if (receipt.discount !== undefined) b.line(aligned('Descuento', money(receipt.discount), columns));
  if (receipt.tax !== undefined) b.line(aligned('Impuestos', money(receipt.tax), columns));
  b.bold(true).line(aligned('TOTAL', money(receipt.total), columns)).bold(false);
  if (receipt.paymentMethod) b.wrapped(`Medio de pago: ${clean(receipt.paymentMethod)}`, { columns });
  if (receipt.paidAmount !== undefined) b.line(aligned('Recibido', money(receipt.paidAmount), columns));
  if (receipt.change !== undefined) b.line(aligned('Cambio', money(receipt.change), columns));
  b.align('center').line('-'.repeat(columns));
  b.wrapped(clean(receipt.footer || 'Gracias por su compra'), { columns });
  return b.feedToTear().build();
}

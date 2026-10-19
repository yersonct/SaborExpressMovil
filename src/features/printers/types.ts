export type PaperWidth = 58 | 80;

/** Preferencia almacenada en el TELÉFONO / caja, no en el usuario. */
export interface SavedPrinter {
  address: string;
  name: string;
  paperWidth: PaperWidth;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  /** Si el servidor ya calculó el subtotal de esta línea, se usa ese valor. */
  total?: number;
}

/** Construir EXCLUSIVAMENTE a partir del pedido/pago confirmado por la API. */
export interface SalesReceipt {
  businessName: string;
  receiptNumber: string;
  date: string;
  branchName?: string;
  cashierName?: string;
  orderNumber?: string;
  tableName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  total: number;
  paymentMethod?: string;
  paidAmount?: number;
  change?: number;
  footer?: string;
}

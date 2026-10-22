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
  branchAddress?: string;
  branchPhone?: string;
  customerName?: string;
  customerDocument?: string;
  customerEmail?: string;
  deliveryAddressLine?: string;
  deliveryAddressReference?: string;
  cashierName?: string;
  orderNumber?: string;
  tableName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount?: number;
  tax?: number;
  taxRate?: number;
  taxIncludedInPrice?: boolean;
  deliveryFee?: number;
  taxLabel?: string;
  deliveryFeeLabel?: string;
  itemLines?: string[];
  total: number;
  paymentMethod?: string;
  labels: {
    title: string;
    receiptNumber: string;
    date: string;
    order: string;
    table: string;
    customer: string;
    customerDocument: string;
    customerEmail: string;
    deliveryAddress: string;
    deliveryReference: string;
    branchPhone: string;
    cashier: string;
    orderType: string;
    orderTypeValue: string;
    quantity: string;
    unitPrice: string;
    itemTotal: string;
    subtotal: string;
    discount: string;
    paymentAmount: string;
    tax: string;
    deliveryFee: string;
    total: string;
    paymentMethod: string;
    received: string;
    change: string;
    takeaway: string;
    notice: string;
    invalidReceipt: string;
    invalidValues: string;
  };
  paidAmount?: number;
  change?: number;
  footer?: string;
}

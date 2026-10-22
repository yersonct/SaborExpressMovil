export interface Invoice {
  id: number;
  invoiceNumber: string;
  paymentId: number;
  orderId: number;
  branchId: number;
  branchName: string | null;
  branchAddress?: string | null;
  branchPhone?: string | null;
  customerName: string | null;
  customerDocument?: string | null;
  customerEmail?: string | null;
  deliveryAddressLine?: string | null;
  deliveryAddressReference?: string | null;
  orderType?: string | null;
  tableNumber?: number | null;
  cashierName?: string | null;
  paymentMethod?: string | null;
  paymentAmount?: number | null;
  paidAt?: string | null;
  items?: {
    name: string;
    quantity: number;
    unitPrice: number;
    total: number;
    notes?: string | null;
    isToGo: boolean;
  }[];
  subTotal: number;
  tax: number;
  taxRate: number;
  taxIncludedInPrice: boolean;
  deliveryFee: number;
  total: number;
  isVoided: boolean;
  issuedAt: string;
}

export interface CreateInvoicePayload {
  paymentId: number;
}

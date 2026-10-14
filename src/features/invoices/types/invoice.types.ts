export interface Invoice {
  id: number;
  invoiceNumber: string;
  paymentId: number;
  orderId: number;
  branchId: number;
  branchName: string | null;
  customerName: string | null;
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

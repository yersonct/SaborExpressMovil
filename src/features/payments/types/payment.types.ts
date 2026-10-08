export enum PaymentMethod {
  Cash = "Cash",
  Card = "Card",
  Transfer = "Transfer",
  Wompi = "Wompi",
}

export enum PaymentStatus {
  Pending = "Pending",
  Completed = "Completed",
  Failed = "Failed",
  Refunded = "Refunded",
}

export interface Payment {  
  id: number;
  orderId: number;
  cashierId: number | null;
  cashierName: string | null;
  method: PaymentMethod;
  amount: number;
  status: PaymentStatus;
  paidAt: string;
  wompiReference: string | null;
  wompiTransactionId: string | null;
}

export interface CreatePaymentPayload {
  orderId: number;
  method: PaymentMethod;
  amount: number;
}

export interface InitWompiPaymentPayload {
  orderId: number;
  amount: number;
}

export interface WompiWidgetData {
  paymentId: number;
  reference: string;
  amountInCents: number;
  currency: string;
  publicKey: string;
  integritySignature: string;
}

// NUEVO — resumen del cierre de caja del Cajero (solo sus pagos de hoy)
export interface CashierShiftSummary {
  totalCash: number;
  totalCard: number;
  totalTransfer: number;
  totalAmount: number;
  paymentsCount: number;
  payments: Payment[];
}

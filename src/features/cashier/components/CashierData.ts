export type OrderType = 'mesa' | 'llevar';

export interface CashierReceiptItem {
  name: string;
  quantity: number;
  unitPrice: number;
  total?: number;
}

export interface Order {
  id: string;
  type: OrderType;
  orderSubtype?: 'DineIn' | 'ToGo' | 'Delivery' | 'Pickup';
  table?: number;
  items: string;
  receiptItems?: CashierReceiptItem[];
  total: number;
  subTotal?: number;
  tax?: number;
  taxRate?: number;
  taxIncludedInPrice?: boolean;
  deliveryFee?: number;
  status: 'pendiente' | 'pagado' | 'pagando_transferencia';
  paymentMethod?: 'transferencia' | 'efectivo';
  deliveryPerson?: string;
  time: string;
  createdAt?: string; // Fecha ISO del servidor
  transferProofUrl?: string;
  // Nombre del cliente para pedidos "Para Llevar" (guestName en el backend).
  customerName?: string;
  // Quién tomó el pedido (mesero/cajero).
  employeeName?: string;
}

export interface Employee {
  id: string;
  name: string;
  role: string;
  startTime: string;
  endTime: string;
  basePay: number;
  status: 'trabajando' | 'pagado';
}

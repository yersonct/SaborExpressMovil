export enum OrderType {
  DineIn = "DineIn",
  ToGo = "ToGo",
  Delivery = "Delivery",
  Pickup = "Pickup",
}

export enum OrderChannel {
  App = "App",
  Counter = "Mostrador",
}

export enum OrderStatus {
  Pending = "Pending",
  Confirmed = "Confirmed",
  InPreparation = "InPreparation",
  Ready = "Ready",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
}

export enum OrderDetailStatus {
  Pending = "Pending",
  InPreparation = "InPreparation",
  Ready = "Ready",
  Delivered = "Delivered",
  Cancelled = "Cancelled",
  Voided = "Voided",
}

export const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  OrderStatus.Pending,
  OrderStatus.Confirmed,
  OrderStatus.InPreparation,
  OrderStatus.Ready,
];

export interface CreateOrderPayload {
  customerId?: number | null;
  tableId?: number | null;
  branchId?: number | null; // Delivery permite elegir sede; si se omite, el backend usa la más cercana.
  addressId?: number | null; // NUEVO
  orderType: OrderType;
  notes?: string | null;
  guestName?: string | null;
}

export interface CreateOrderDetailPayload {
  productId: number;
  quantity: number;
  notes?: string | null;
  isToGo?: boolean;
}

export interface OrderSummary {
  id: number;
  customerId: number | null;
  customerName: string | null;
  employeeId: number | null;
  employeeName: string | null;
  tableId: number | null;
  tableNumber: number | null;
  tableSessionId: string | null;
  branchId: number;
  channel: OrderChannel;
  orderType: OrderType;
  status: OrderStatus;
  subTotal: number;
  tax: number;
  taxRate: number;
  deliveryFee: number;
  total: number;
  isFullyPaid: boolean;
  taxIncludedInPrice: boolean;
  createdAt: string;
  paidAt?: string | null;
  orderDetails: OrderDetail[]; // 👈 nuevo
  assignedDeliveryPersonId: number | null;
  assignedDeliveryPersonName: string | null;
}

export interface OccupiedTableWaiter {
  tableId: number;
  employeeId: number | null;
  employeeName: string | null;
}

export interface OrderDetail {
  id: number;
  orderId: number;
  productId: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  subTotal: number;
  notes: string | null;
  isToGo: boolean;
  batchNumber: number;
  status: OrderDetailStatus;
  lastModifiedByEmployeeId: number;
  lastModifiedByEmployeeName: string | null;
}

export interface Order {
  id: number;
  customerId: number | null;
  customerName: string | null;
  employeeId: number | null;
  employeeName: string | null;
  tableId: number | null;
  tableNumber: number | null;
  branchId: number;
  branchName: string | null;
  orderType: OrderType;
  status: OrderStatus;
  subTotal: number;
  tax: number;
  taxRate: number;
  taxIncludedInPrice: boolean;
  deliveryFee: number;
  total: number;
  notes: string | null;
  createdAt: string;
  updatedAt: string | null;
  orderDetails: OrderDetail[];
  assignedDeliveryPersonId: number | null;
  assignedDeliveryPersonName: string | null;
}

// Misma regla que el back: solo antes de que cocina empiece y sin pago completo.
export function canCustomerCancel(
  order: Pick<OrderSummary, "status" | "isFullyPaid" | "orderDetails">,
): boolean {
  if (
    order.status !== OrderStatus.Pending &&
    order.status !== OrderStatus.Confirmed
  )
    return false;
  if (order.isFullyPaid) return false;
  return !order.orderDetails.some(
    (d) =>
      d.status === OrderDetailStatus.InPreparation ||
      d.status === OrderDetailStatus.Ready ||
      d.status === OrderDetailStatus.Delivered,
  );
}

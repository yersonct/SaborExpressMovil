export enum DeliveryStatus {
  Assigned = "Assigned",
  InTransit = "InTransit",
  Delivered = "Delivered",
}

export interface Delivery {
  id: number;
  orderId: number;
  addressId: number;
  addressText: string | null;
  addressReference: string | null;
  addressLatitude: number | null;
  addressLongitude: number | null;
  deliveryPersonId: number;
  deliveryPersonName: string | null;
  deliveryPersonPhone: string | null;
  status: DeliveryStatus;
  assignedAt: string;
  deliveredAt: string | null;
  customerName: string | null;
  customerPhone: string | null;
  itemsCount: number;
  paymentMethod: string | null;
  paymentStatus: string | null;
  kitchenReady: boolean;
  orderNotes: string | null;
  total: number;
  amountPaid: number;
  amountPending: number;
  orderStatus: string | null;
  customerRating: number | null;
  customerRatingComment: string | null;
  items: DeliveryItem[];
}

export interface DeliveryItem {
  productName: string;
  quantity: number;
  unitPrice: number;
  notes: string | null;
}

export enum TableStatus {
  Available = "Available",
  Occupied = "Occupied",
  Reserved = "Reserved",
  Inactive = "Inactive",
}

export interface Table {
  id: number;
  branchId: number;
  branchName: string | null;
  number: number;
  currentSessionId: string | null;
  status: TableStatus;
  createdAt: string;
}

export interface UpdateTableStatusPayload {
  status: TableStatus;
}


export interface TableReleaseOrder {
  orderId: number;
  createdAt: string;
  status: string;
  total: number;
  paidAmount: number;
  isDelivered: boolean;
  isPaid: boolean;
}

export interface TableReleaseReview {
  tableId: number;
  tableNumber: number;
  branchId: number;
  currentSessionId: string | null;
  isOccupied: boolean;
  isPreviousDay: boolean;
  isOrphan: boolean;
  canReleaseNormally: boolean;
  requiresAdministrativeRelease: boolean;
  outstandingAmount: number;
  orders: TableReleaseOrder[];
}

export interface ReleasePreviousTablePayload {
  expectedSessionId: string | null;
  administrative: boolean;
  reason?: string;
}

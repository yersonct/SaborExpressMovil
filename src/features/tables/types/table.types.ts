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
  status: TableStatus;
  createdAt: string;
}

export interface UpdateTableStatusPayload {
  status: TableStatus;
}

export interface EmployeeMe {
  id: number;
  name: string;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  branchId: number | null;
  branchName: string | null;
  roleNames: string[];
  tablesAttendedToday: number;
  toGoOrdersToday: number;
  isAvailable: boolean;
  paymentsCollectedToday: number;
  amountCollectedToday: number;
  tripsCompleted: number;
  averageRating: number | null;
}

export interface UpdateEmployeeMePayload {
  name: string;
  lastName?: string;
  phone?: string;
}

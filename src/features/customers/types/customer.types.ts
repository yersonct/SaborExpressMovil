export interface CustomerMe {
  id: number;
  userId: number | null;
  name: string | null;
  lastName: string | null;
  document: string | null;
  phone: string | null;
  address: string | null;
  email: string | null;
}

export interface UpdateCustomerMePayload {
  name: string;
  lastName?: string;
  phone?: string;
  address?: string;
}

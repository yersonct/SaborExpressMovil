export interface Address {
  id: number;
  customerId: number;
  addressLine: string;
  reference: string | null;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface CreateAddressPayload {
  addressLine: string;
  reference?: string;
  latitude: number;
  longitude: number;
  isDefault: boolean;
}

export interface UpdateAddressPayload {
  addressLine: string;
  reference?: string;
  latitude: number;
  longitude: number;
}

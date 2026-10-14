import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { ADDRESSES_ENDPOINTS } from "./addressEndpoints";
import type {
  Address,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "../types/address.types";

export const addressService = {
  getByCustomer: async (customerId: number): Promise<Address[]> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.byCustomer(customerId));
    return handleResponse<Address[]>(res);
  },

  getById: async (id: number): Promise<Address> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.byId(id));
    return handleResponse<Address>(res);
  },

  create: async (payload: CreateAddressPayload): Promise<Address> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.create, {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<Address>(res);
  },

  update: async (
    id: number,
    payload: UpdateAddressPayload,
  ): Promise<Address> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.update(id), {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleResponse<Address>(res);
  },
  getMyDefault: async (): Promise<Address | null> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.myDefault);
    if (res.status === 404) return null; // el cliente no tiene dirección predeterminada aún
    return handleResponse<Address>(res);
  },

  setDefault: async (id: number): Promise<Address> => {
    const res = await fetchAuthed(ADDRESSES_ENDPOINTS.setDefault(id), {
      method: "PATCH",
    });
    return handleResponse<Address>(res);
  },

  remove: async (id: number): Promise<void> => {
    await fetchAuthed(ADDRESSES_ENDPOINTS.delete(id), {
      method: "DELETE",
    });
  },
};

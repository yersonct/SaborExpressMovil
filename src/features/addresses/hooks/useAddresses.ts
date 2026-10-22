import { useCallback, useEffect, useRef, useState } from "react";
import { addressService } from "../services/addressService";
import type {
  Address,
  CreateAddressPayload,
  UpdateAddressPayload,
} from "../types/address.types";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export function useAddresses(customerId: number | null) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Cliente para el que ya se cargaron direcciones: las recargas siguientes
  // no deben volver a mostrar el estado "cargando".
  const loadedForRef = useRef<number | null>(null);

  const fetchAddresses = useCallback(async () => {
    if (!customerId) {
      setAddresses([]);
      setLoading(false);
      return;
    }
    if (loadedForRef.current !== customerId) setLoading(true);
    setError(null);
    try {
      const data = await addressService.getByCustomer(customerId);
      // La dirección predeterminada siempre primero, para que sea la más visible
      setAddresses(
        [...data].sort((a, b) => Number(b.isDefault) - Number(a.isDefault)),
      );
      loadedForRef.current = customerId;
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar tus direcciones");
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => deferEffect(() => {
    fetchAddresses();
  }), [fetchAddresses]);

const createAddress = async (payload: CreateAddressPayload) => {
  const created = await addressService.create(payload);
  await fetchAddresses();
  return created;
};

  const updateAddress = async (id: number, payload: UpdateAddressPayload) => {
    await addressService.update(id, payload);
    await fetchAddresses();
  };

  const setDefaultAddress = async (id: number) => {
    await addressService.setDefault(id);
    await fetchAddresses();
  };

  const deleteAddress = async (id: number) => {
    await addressService.remove(id);
    await fetchAddresses();
  };

  return {
    addresses,
    loading,
    error,
    createAddress,
    updateAddress,
    setDefaultAddress,
    deleteAddress,
    refetch: fetchAddresses,
  };
}

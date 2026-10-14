import { useCallback, useEffect, useState } from "react";
import { customerService } from "../services/customerService";
import type {
  CustomerMe,
  UpdateCustomerMePayload,
} from "../types/customer.types";

export function useCompleteProfile() {
  const [customer, setCustomer] = useState<CustomerMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [needsCompletion, setNeedsCompletion] = useState(false);

  const fetchMe = useCallback(async () => {
    setLoading(true);
    try {
      const data = await customerService.getMe();
      setCustomer(data);
      setNeedsCompletion(!data.phone || !data.address);
    } catch {
      // silencioso: si falla, no forzamos el modal
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMe();
  }, [fetchMe]);

  const completeProfile = async (payload: UpdateCustomerMePayload) => {
    const updated = await customerService.updateMe(payload);
    setCustomer(updated);
    setNeedsCompletion(false);
    return updated;
  };

  return {
    customer,
    loading,
    needsCompletion,
    completeProfile,
    refetch: fetchMe,
  };
}

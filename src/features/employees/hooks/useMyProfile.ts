import { useCallback, useEffect, useState } from "react";
import { employeeService } from "../services/employeeService";
import type {
  EmployeeMe,
  UpdateEmployeeMePayload,
} from "../types/employee.types";

export function useMyProfile() {
  const [profile, setProfile] = useState<EmployeeMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await employeeService.getMe();
      setProfile(data);
    } catch (err: any) {
      setError(err?.message ?? "No se pudo cargar tu perfil");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (payload: UpdateEmployeeMePayload) => {
    const updated = await employeeService.updateMe(payload);
    setProfile(updated);
    return updated;
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
}

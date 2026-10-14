import { useMemo } from "react";
import { useAuth } from "../../auth/context/AuthContext";
import { getBranchIdFromToken } from "../../auth/services/decodeToken";

export function useMyBranch() {
  const { user } = useAuth();

  const branchId = useMemo(() => {
    if (!user?.token) return null;
    return getBranchIdFromToken(user.token);
  }, [user?.token]);

  return { branchId, loading: false, error: null };
}

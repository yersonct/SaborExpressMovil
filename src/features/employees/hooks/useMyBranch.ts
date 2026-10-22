import { useAuth } from "../../auth/context/AuthContext";
import { getBranchIdFromToken } from "../../auth/services/decodeToken";

export function useMyBranch() {
  const { user } = useAuth();

  const branchId = user?.token ? getBranchIdFromToken(user.token) : null;

  return { branchId, loading: false, error: null };
}

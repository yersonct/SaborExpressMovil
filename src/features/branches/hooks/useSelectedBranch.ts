import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePublicBranches } from "./usePublicBranches";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";

const SELECTED_BRANCH_PREFIX = "saborexpress_client_selected_branch";

export function useSelectedBranch() {
  const { user } = useAuth();
  const userScope = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";
  const storageKey = `${SELECTED_BRANCH_PREFIX}:${encodeURIComponent(userScope)}`;
  const { branches, loading, error } = usePublicBranches();
  const [selection, setSelection] = useState<{ storageKey: string; branchId: number | null } | null>(null);
  const [restoringKey, setRestoringKey] = useState<string | null>(null);
  const selectedBranchId = selection?.storageKey === storageKey ? selection.branchId : null;
  const restoring = restoringKey !== storageKey;

  useEffect(() => {
    if (loading) return;

    let active = true;
    (async () => {
      try {
        const savedId = await AsyncStorage.getItem(storageKey);
        if (savedId && branches.some((b) => b.id === Number(savedId))) {
          if (active) setSelection({ storageKey, branchId: Number(savedId) });
        } else if (branches.length === 1) {
          if (active) setSelection({ storageKey, branchId: branches[0].id });
        } else if (active) {
          setSelection({ storageKey, branchId: null });
        }
      } finally {
        if (active) setRestoringKey(storageKey);
      }
    })();
    return () => { active = false; };
  }, [loading, branches, storageKey]);

  const selectBranch = useCallback(async (branchId: number) => {
    setSelection({ storageKey, branchId });
    await AsyncStorage.setItem(storageKey, String(branchId));
  }, [storageKey]);

  return {
    branches,
    selectedBranchId,
    selectBranch,
    loading: loading || restoring,
    error,
  };
}

import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { usePublicBranches } from "./usePublicBranches";

const SELECTED_BRANCH_KEY = "saborexpress_client_selected_branch";

export function useSelectedBranch() {
  const { branches, loading, error } = usePublicBranches();
  const [selectedBranchId, setSelectedBranchId] = useState<number | null>(null);
  const [restoring, setRestoring] = useState(true);

  useEffect(() => {
    if (loading) return;

    (async () => {
      try {
        const savedId = await AsyncStorage.getItem(SELECTED_BRANCH_KEY);
        if (savedId && branches.some((b) => b.id === Number(savedId))) {
          setSelectedBranchId(Number(savedId));
        } else if (branches.length === 1) {
          setSelectedBranchId(branches[0].id);
        }
      } finally {
        setRestoring(false);
      }
    })();
  }, [loading, branches]);

  const selectBranch = useCallback(async (branchId: number) => {
    setSelectedBranchId(branchId);
    await AsyncStorage.setItem(SELECTED_BRANCH_KEY, String(branchId));
  }, []);

  return {
    branches,
    selectedBranchId,
    selectBranch,
    loading: loading || restoring,
    error,
  };
}

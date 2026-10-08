import { useEffect, useState } from "react";
import { branchService } from "../services/branchService";
import type { PublicBranch } from "../types/branch.types";

export function usePublicBranches() {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await branchService.getPublicActive();
        if (mounted) setBranches(data);
      } catch (err: any) {
        if (mounted)
          setError(err?.message ?? "No se pudieron cargar las sedes");
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return { branches, loading, error };
}

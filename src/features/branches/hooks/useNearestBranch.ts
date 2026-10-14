import { useEffect, useState } from "react";
import { branchService } from "../services/branchService";
import type { PublicBranch } from "../types/branch.types";

// Recalcula la sede más cercana cada vez que cambian las coordenadas
// (ej. el cliente elige otra dirección de entrega).
export function useNearestBranch(
  latitude: number | null | undefined,
  longitude: number | null | undefined,
) {
  const [branch, setBranch] = useState<PublicBranch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude == null || longitude == null) {
      setBranch(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    (async () => {
      setBranch(null);
      setLoading(true);
      setError(null);
      try {
        const data = await branchService.getNearest(latitude, longitude);
        if (mounted) setBranch(data);
      } catch (err: any) {
        if (mounted) {
          setError(err?.message ?? "No se pudo determinar la sede más cercana");
          setBranch(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [latitude, longitude]);

  return { branch, loading, error };
}

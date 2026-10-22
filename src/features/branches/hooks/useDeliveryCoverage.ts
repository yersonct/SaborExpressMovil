import { useEffect, useMemo, useState } from "react";
import { branchSettingsService } from "../services/branchSettingsService";
import type { PublicBranch } from "../types/branch.types";
import { deferEffect } from "@/features/shared/utils/deferEffect";

/** Radio operativo real de cada sede. null = no configurado/no disponible. */
export function useDeliveryCoverage(branches: PublicBranch[], enabled: boolean) {
  const ids = useMemo(() => branches.map((b) => b.id).join(","), [branches]);
  const [radii, setRadii] = useState<Record<number, number | null>>({});
  const [loading, setLoading] = useState(false);

  useEffect(() => deferEffect(() => {
    if (!enabled || !ids) {
      setRadii({});
      setLoading(false);
      return;
    }
    let alive = true;
    setRadii({});
    setLoading(true);
    const branchIds = ids.split(",").map(Number);
    Promise.all(branchIds.map(async (id): Promise<readonly [number, number | null]> => {
      try {
        const s = await branchSettingsService.get(id, true);
        const radius = Number(s.deliveryRadiusKm);
        return [id, !s.isDefault && Number.isFinite(radius) && radius > 0 ? radius : null] as const;
      } catch {
        return [id, null] as const;
      }
    })).then((results) => {
      if (alive) setRadii(Object.fromEntries(results));
    }).finally(() => {
      if (alive) setLoading(false);
    });
    return () => { alive = false; };
  }), [ids, enabled]);

  return { radii, loading };
}

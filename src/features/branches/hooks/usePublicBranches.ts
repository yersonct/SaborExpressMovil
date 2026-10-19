import { useEffect, useState } from "react";
import { branchService } from "../services/branchService";
import type { PublicBranch } from "../types/branch.types";
import {
  BRANCH_OPERATIONAL_SETTINGS_CHANGED,
  PUBLIC_BRANCHES_CHANGED,
  REALTIME_CONNECTED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";

export function usePublicBranches(enabled = true) {
  const [branches, setBranches] = useState<PublicBranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) return;
    let mounted = true;
    let sequence = 0;
    const load = async () => {
      const request = ++sequence;
      try {
        const data = await branchService.getPublicActive();
        if (mounted && request === sequence) {
          setBranches(data);
          setError(null);
        }
      } catch (err: any) {
        if (mounted && request === sequence) {
          setError(err?.message ?? "No se pudieron cargar las sedes");
        }
      } finally {
        if (mounted && request === sequence) setLoading(false);
      }
    };
    void load();
    const timer = setInterval(() => { void load(); }, 20_000);
    const unsubscribers = [
      subscribeRealtimeEvent(BRANCH_OPERATIONAL_SETTINGS_CHANGED, () => { void load(); }),
      subscribeRealtimeEvent(PUBLIC_BRANCHES_CHANGED, () => { void load(); }),
      subscribeRealtimeEvent(REALTIME_CONNECTED, () => { void load(); }),
    ];
    return () => {
      mounted = false;
      sequence += 1;
      clearInterval(timer);
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [enabled]);

  return { branches, loading, error };
}

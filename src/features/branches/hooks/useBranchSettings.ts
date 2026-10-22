import { useEffect, useState } from "react";
import {
  branchSettingsService,
  type BranchSettings,
} from "../services/branchSettingsService";
import {
  BRANCH_OPERATIONAL_SETTINGS_CHANGED,
  REALTIME_CONNECTED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export function useBranchSettings(branchId: number | null | undefined) {
  const [settings, setSettings] = useState<BranchSettings | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => deferEffect(() => {
    if (!branchId) {
      setSettings(null);
      setLoading(false);
      return;
    }
    let mounted = true;
    let latestRequest = 0;
    setSettings(null);

    const load = async (forceFresh = false) => {
      const request = ++latestRequest;
      setLoading(true);
      try {
        const next = await branchSettingsService.get(branchId, forceFresh);
        if (mounted && request === latestRequest) setSettings(next);
      } catch {
        if (mounted && request === latestRequest && !forceFresh) {
          setSettings(null);
        }
      } finally {
        if (mounted && request === latestRequest) setLoading(false);
      }
    };

    void load();
    const unsubscribeSettings = subscribeRealtimeEvent(
      BRANCH_OPERATIONAL_SETTINGS_CHANGED,
      (changedBranchId) => {
        if (Number(changedBranchId) === branchId) void load(true);
      },
    );
    const unsubscribeReconnect = subscribeRealtimeEvent(REALTIME_CONNECTED, () => {
      void load(true);
    });

    return () => {
      mounted = false;
      latestRequest += 1;
      unsubscribeSettings();
      unsubscribeReconnect();
    };
  }), [branchId]);

  return { settings, loading };
}

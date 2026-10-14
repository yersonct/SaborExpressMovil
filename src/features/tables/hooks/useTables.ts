import { useCallback, useEffect, useState } from "react";
import { tableService } from "../services/tableService";
import { TableStatus, type Table } from "../types/table.types";
import { useRealtimeEvents } from "@/features/shared/hooks/useRealtimeEvents";

export function useTables(branchId: number | null) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async (silent = false) => {
    if (!branchId) {
      setTables([]);
      setError(null);
      setLoading(false);
      return;
    }
    if (!silent) {
      setLoading(true);
      setError(null);
    }
    try {
      const data = await tableService.getByBranch(branchId);
      setTables(data.sort((a, b) => a.number - b.number));
      setError(null);
    } catch (err: any) {
      if (!silent) setError(err?.message ?? "No se pudieron cargar las mesas");
    } finally {
      if (!silent) setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  useRealtimeEvents(["TablesChanged", "RealtimeConnected"], () => {
    void fetchTables(true);
  });

  const setTableStatus = async (id: number, status: TableStatus) => {
    await tableService.updateStatus(id, { status });
    await fetchTables(true);
  };

  return { tables, loading, error, setTableStatus, refetch: fetchTables };
}

import { useCallback, useEffect, useState } from "react";
import { tableService } from "../services/tableService";
import { TableStatus, type Table } from "../types/table.types";

export function useTables(branchId: number | null) {
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    if (!branchId) {
      setTables([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await tableService.getByBranch(branchId);
      setTables(data.sort((a, b) => a.number - b.number));
    } catch (err: any) {
      setError(err?.message ?? "No se pudieron cargar las mesas");
    } finally {
      setLoading(false);
    }
  }, [branchId]);

  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  const setTableStatus = async (id: number, status: TableStatus) => {
    await tableService.updateStatus(id, { status });
    await fetchTables();
  };

  return { tables, loading, error, setTableStatus, refetch: fetchTables };
}

import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { TABLES_ENDPOINTS } from "./tableEndpoints";
import type { Table, UpdateTableStatusPayload } from "../types/table.types";

export const tableService = {
  getByBranch: async (branchId: number): Promise<Table[]> => {
    const res = await fetchAuthed(TABLES_ENDPOINTS.byBranch(branchId));
    return handleResponse<Table[]>(res);
  },

  updateStatus: async (
    id: number,
    payload: UpdateTableStatusPayload,
  ): Promise<Table> => {
    const res = await fetchAuthed(TABLES_ENDPOINTS.updateStatus(id), {
      method: "PATCH",
      body: JSON.stringify(payload),
    });
    return handleResponse<Table>(res);
  },
  
};

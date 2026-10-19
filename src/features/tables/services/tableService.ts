import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { TABLES_ENDPOINTS } from "./tableEndpoints";
import type { Table, UpdateTableStatusPayload, TableReleaseReview, ReleasePreviousTablePayload } from "../types/table.types";

export const tableService = {
  getPreviousReleaseReviews: async (branchId: number): Promise<TableReleaseReview[]> => {
    const res = await fetchAuthed(TABLES_ENDPOINTS.previousReleaseReviews(branchId));
    return handleResponse<TableReleaseReview[]>(res);
  },

  getReleaseReview: async (id: number): Promise<TableReleaseReview> => {
    const res = await fetchAuthed(TABLES_ENDPOINTS.releaseReview(id));
    return handleResponse<TableReleaseReview>(res);
  },

  releasePrevious: async (id: number, payload: ReleasePreviousTablePayload): Promise<Table> => {
    const res = await fetchAuthed(TABLES_ENDPOINTS.releasePrevious(id), {
      method: "POST",
      body: JSON.stringify(payload),
    });
    return handleResponse<Table>(res);
  },
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

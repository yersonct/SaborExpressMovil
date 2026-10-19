import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import { handleResponse } from "@/features/auth/services/handleResponse";

export interface CashClosurePreview {
  scheduleId: number;
  branchId: number;
  branchName: string;
  shiftDate: string;
  isClosed: boolean;
  existingClosureId: number | null;
  cashExpected: number;
  cardTotal: number;
  transferTotal: number;
  wompiTotal: number;
  totalSales: number;
  paymentsCount: number;
}

export interface CompletedCashClosure {
  id: number;
  cashExpected: number;
  cashCounted: number;
  cashDifference: number;
  totalSales: number;
  closedAtUtc: string;
}

export const cashClosureService = {
  preview: async (): Promise<CashClosurePreview> => {
    const response = await fetchAuthed(`${API_BASE_URL}/api/CashClosures/current`);
    return handleResponse<CashClosurePreview>(response);
  },
  close: async (cashCounted: number, notes: string): Promise<CompletedCashClosure> => {
    const response = await fetchAuthed(`${API_BASE_URL}/api/CashClosures`, {
      method: "POST",
      body: JSON.stringify({ cashCounted, notes: notes.trim() || null }),
    });
    return handleResponse<CompletedCashClosure>(response);
  },
};

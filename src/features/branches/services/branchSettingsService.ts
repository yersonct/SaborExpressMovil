import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { API_BASE_URL } from "@/config/api";

export interface BranchSettings {
  branchId: number;
  taxRate: number;
  deliveryFee: number;
  deliveryRadiusKm: number;
  isDefault: boolean; // true = la sede aún no configuró nada
}

export const branchSettingsService = {
  get: async (
    branchId: number,
    forceFresh = false,
  ): Promise<BranchSettings> => {
    const res = await fetchAuthed(
      `${API_BASE_URL}/api/branch-settings/${branchId}`,
      forceFresh ? { cache: "no-store" } : undefined,
    );
    return handleResponse<BranchSettings>(res);
  },
};

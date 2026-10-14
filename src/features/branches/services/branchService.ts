import { fetchAuthed } from "../../auth/services/apiClient";
import { handleResponse } from "../../auth/services/handleResponse";
import { API_BASE_URL } from "@/config/api";
import type { PublicBranch } from "../types/branch.types";

export const branchService = {
  getPublicActive: async (): Promise<PublicBranch[]> => {
    const res = await fetchAuthed(`${API_BASE_URL}/api/Branches/public`);
    return handleResponse<PublicBranch[]>(res);
  },

  // Sede más cercana a unas coordenadas (dirección elegida por el cliente)
  getNearest: async (
    latitude: number,
    longitude: number,
  ): Promise<PublicBranch> => {
    const res = await fetchAuthed(
      `${API_BASE_URL}/api/Branches/nearest?latitude=${latitude}&longitude=${longitude}`,
    );
    return handleResponse<PublicBranch>(res);
  },
};

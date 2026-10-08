import { fetchAuthed } from "@/features/auth/services/apiClient";
import { SCHEDULE_ENDPOINTS } from "./scheduleEndpoints";
import type { CurrentShiftResponse } from "../types/schedule.types";

export const scheduleService = {
  async getCurrentShift(
    employeeId: number,
  ): Promise<CurrentShiftResponse | null> {
    try {
      const res = await fetchAuthed(
        SCHEDULE_ENDPOINTS.currentShift(employeeId),
      );
      if (!res.ok) return null;
      return await res.json();
    } catch {
      // Si falla (red, tunnel, etc.) no rompemos el arranque de la app —
      // se sigue usando el rol cacheado hasta el próximo intento.
      return null;
    }
  },
};

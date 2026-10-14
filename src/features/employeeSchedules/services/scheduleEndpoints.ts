import { API_BASE_URL } from "@/config/api";

export const SCHEDULE_ENDPOINTS = {
  currentShift: (employeeId: number) =>
    `${API_BASE_URL}/api/employee-schedules/employee/${employeeId}/current`,
} as const;

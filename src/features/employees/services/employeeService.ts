import { fetchAuthed } from "@/features/auth/services/apiClient";
import { handleResponse } from "@/features/auth/services/handleResponse";
import type {
  EmployeeMe,
  UpdateEmployeeMePayload,
} from "../types/employee.types";

import { API_BASE_URL } from "@/config/api";
const EMPLOYEES_BASE_URL = `${API_BASE_URL}/api/Employees`;

export const employeeService = {
  getMe: async (): Promise<EmployeeMe> => {
    const res = await fetchAuthed(`${EMPLOYEES_BASE_URL}/me`);
    return handleResponse<EmployeeMe>(res);
  },

  updateMe: async (payload: UpdateEmployeeMePayload): Promise<EmployeeMe> => {
    const res = await fetchAuthed(`${EMPLOYEES_BASE_URL}/me`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });
    return handleResponse<EmployeeMe>(res);
  },
  setAvailability: async (isAvailable: boolean): Promise<EmployeeMe> => {
    const res = await fetchAuthed(`${EMPLOYEES_BASE_URL}/me/availability`, {
      method: "PATCH",
      body: JSON.stringify({ isAvailable }),
    });
    return handleResponse<EmployeeMe>(res);
  },
  updateMyLocation: async (latitude: number, longitude: number): Promise<void> => {
    const res = await fetchAuthed(`${EMPLOYEES_BASE_URL}/me/location`, {
      method: "PUT",
      body: JSON.stringify({ latitude, longitude }),
    });
    await handleResponse(res);
  },
};

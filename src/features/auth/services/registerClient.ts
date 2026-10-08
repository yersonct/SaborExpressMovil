import type { ClientRegisterData, AuthResponse } from "../types";
import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";

export async function registerClient(
  data: ClientRegisterData,
): Promise<{ message: string }> {
  const res = await fetch(AUTH_ENDPOINTS.registerClient, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<{ message: string }>(res);
}

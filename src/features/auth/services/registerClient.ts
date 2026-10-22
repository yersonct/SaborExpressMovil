import type { ClientRegisterData } from "../types";
import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export async function registerClient(
  data: ClientRegisterData,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.registerClient, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
    },
    body: JSON.stringify(data),
  });

  return handleResponse<{ message: string }>(res);
}

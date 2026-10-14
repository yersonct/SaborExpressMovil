import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export interface ConfirmEmailPayload {
  token: string;
}

export async function confirmEmail(
  payload: ConfirmEmailPayload,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.confirmEmail, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "*/*",
      "X-DevTunnels-Skip-Browser-Warning": "true",
    },
    body: JSON.stringify(payload),
  });
  return handleResponse<{ message: string }>(res);
}

import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export interface ActivateAccountPayload {
  token: string;
  newPassword: string;
}

export async function activateAccount(
  payload: ActivateAccountPayload,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.activateAccount, {
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

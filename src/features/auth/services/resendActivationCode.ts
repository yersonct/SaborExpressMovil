import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export interface ResendActivationPayload {
  identifier: string;
}

export async function resendActivationCode(
  payload: ResendActivationPayload,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.resendActivationCode, {
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

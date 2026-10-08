import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";

export interface ResendConfirmationPayload {
  identifier: string;
}

export async function resendConfirmationCode(
  payload: ResendConfirmationPayload,
): Promise<{ message: string }> {
  const res = await fetch(AUTH_ENDPOINTS.resendConfirmationCode, {
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

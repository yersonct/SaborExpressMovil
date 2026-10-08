import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";

export interface ActivateAccountPayload {
  token: string;
  newPassword: string;
}

export async function activateAccount(
  payload: ActivateAccountPayload,
): Promise<{ message: string }> {
  const res = await fetch(AUTH_ENDPOINTS.activateAccount, {
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

import { AUTH_ENDPOINTS } from "./authEndpoints";
import { handleResponse } from "./handleResponse";

export async function verifyResetCode(
  identifier: string,
  code: string,
): Promise<{ resetToken: string }> {
  const res = await fetch(AUTH_ENDPOINTS.verifyResetCode, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ identifier, code }),
  });
  return handleResponse<{ resetToken: string }>(res);
}

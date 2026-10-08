import { AUTH_ENDPOINTS } from "./authEndpoints";
import { handleResponse } from "./handleResponse";

export async function forgotPassword(
  identifier: string,
): Promise<{ message: string }> {
  const res = await fetch(AUTH_ENDPOINTS.forgotPassword, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ identifier }),
  });
  return handleResponse<{ message: string }>(res);
}

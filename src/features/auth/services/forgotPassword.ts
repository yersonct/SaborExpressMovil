import { AUTH_ENDPOINTS } from "./authEndpoints";
import { handleResponse } from "./handleResponse";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export async function forgotPassword(
  identifier: string,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.forgotPassword, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ identifier }),
  });
  return handleResponse<{ message: string }>(res);
}

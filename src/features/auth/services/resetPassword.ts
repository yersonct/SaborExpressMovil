import { AUTH_ENDPOINTS } from "./authEndpoints";
import { handleResponse } from "./handleResponse";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

export async function resetPassword(
  resetToken: string,
  newPassword: string,
  confirmPassword: string,
): Promise<{ message: string }> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.resetPassword, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "*/*" },
    body: JSON.stringify({ resetToken, newPassword, confirmPassword }),
  });
  return handleResponse<{ message: string }>(res);
}

import type { LoginCredentials, AuthResponse } from "../types";
import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000);

  try {
    const res = await fetch(AUTH_ENDPOINTS.login, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "*/*" },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const raw = await handleResponse<any>(res);

    // 🔎 TEMPORAL: descomenta, haz un login y revisa la consola de Metro
    // console.log("RAW LOGIN RESPONSE:", JSON.stringify(raw, null, 2));
return {
  token: raw.token,
  refreshToken: raw.refreshToken,
  identifier: raw.identifier,
  roles: raw.roles ?? [],
  hasActiveShift: raw.hasActiveShift ?? true,
  activeShiftRoleName: raw.activeShiftRoleName ?? null,
};
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === "AbortError") {
      throw {
        message: "La solicitud tardó demasiado. Revisa tu conexión.",
        statusCode: 408,
      };
    }
    throw err;
  }
}

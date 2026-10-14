import type { LoginCredentials, AuthResponse } from "../types";
import { handleResponse } from "./handleResponse";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { mapLoginRequest } from "./mappers/mapLoginRequest";
import { getApiLanguage } from "./apiLanguage";
import {
  fetchWithNetworkHandling,
  isNetworkFailure,
  toUserFacingNetworkError,
} from "@/features/shared/services/networkStatus";

const LOGIN_TIMEOUT_MS = 20_000;

export async function login(
  credentials: LoginCredentials,
): Promise<AuthResponse> {
  const controller = new AbortController();
  // El login valida credenciales y persiste la sesión antes de responder.
  const timeoutId = setTimeout(() => controller.abort(), LOGIN_TIMEOUT_MS);

  try {
    const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.login, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Language": getApiLanguage(),
        "X-Tunnel-Skip-AntiPhishing-Page": "true",
      },
      body: JSON.stringify(mapLoginRequest(credentials)),
      signal: controller.signal,
    });
    if ([502, 503, 504].includes(res.status)) {
      throw {
        message: "El servicio no está disponible por el momento. Intenta de nuevo más tarde.",
        statusCode: 503,
      };
    }
    const raw = await handleResponse<any>(res);

return {
  token: raw.token,
  refreshToken: raw.refreshToken,
  identifier: raw.identifier,
  roles: raw.roles ?? [],
  hasActiveShift: raw.hasActiveShift ?? true,
  activeShiftRoleName: raw.activeShiftRoleName ?? null,
};
  } catch (err) {
    // React Native puede reportar el aborto con un error que no se llama AbortError.
    if (controller.signal.aborted || (err instanceof Error && err.name === "AbortError")) {
      throw {
        message:
          "El inicio de sesión tardó más de 20 segundos. Revisa tu conexión y que el servicio esté disponible.",
        statusCode: 408,
      };
    }
    if (isNetworkFailure(err)) {
      throw toUserFacingNetworkError(err);
    }
    if (err instanceof TypeError) {
      throw {
        message:
          "El servicio no está disponible por el momento. Intenta de nuevo más tarde.",
        statusCode: 503,
      };
    }
    throw err;
  } finally {
    clearTimeout(timeoutId);
  }
}

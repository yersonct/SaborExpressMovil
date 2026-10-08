import {
  getToken,
  getRefreshToken,
  saveSession,
  loadSession,
  clearSession,
} from "./tokenStorage";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { notifySessionExpired } from "./authEvents";
import { ROLE_NAMES } from "../types/role";

const OPERATIVE_ROLES: string[] = [
  ROLE_NAMES.Mesero,
  ROLE_NAMES.Cajero,
  ROLE_NAMES.Cocinero,
  ROLE_NAMES.Repartidor,
  ROLE_NAMES.AuxiliarCocina,
];

// Todos los que pidan renovar el token (fetchAuthed, SignalR) comparten UNA sola llamada.
let refreshPromise: Promise<string | null> | null = null;

// Reintenta solo ante fallas de red reales (tunnel no listo, wifi cortado, etc.)
// No reintenta ante 401/500/etc., esos ya son respuestas válidas del servidor.
async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
  retries = 2,
  delayMs = 1000,
): Promise<Response> {
  try {
    return await fetch(input, init);
  } catch (err) {
    const isNetworkError =
      err instanceof TypeError &&
      /failed to fetch|network request failed/i.test(err.message);

    if (retries > 0 && isNetworkError) {
      await new Promise((res) => setTimeout(res, delayMs));
      return fetchWithRetry(input, init, retries - 1, delayMs * 2);
    }
    throw err;
  }
}

export function refreshAccessToken(): Promise<string | null> {
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => {
      refreshPromise = null;
    });
  }
  return refreshPromise;
}

async function doRefresh(): Promise<string | null> {
  const refreshToken = await getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetchWithRetry(AUTH_ENDPOINTS.refreshToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "X-Tunnel-Skip-AntiPhishing-Page": "true",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) return null;

    const data = await res.json();

    // Si antes tenía un rol operativo y el backend ya no lo devuelve,
    // el rol fue revocado: cerramos sesión (el usuario debe volver al login).
    const previous = await loadSession();
    const newRoles: string[] = data.roles ?? [];
    const lostRole = (previous?.roles ?? []).some(
      (r) => OPERATIVE_ROLES.includes(r) && !newRoles.includes(r),
    );
    if (lostRole) {
      await clearSession();
      notifySessionExpired("role_revoked");
      return null;
    }

    // Guardamos la sesión completa renovada (nuevo token + nuevo refreshToken rotado)
    await saveSession({
      token: data.token,
      refreshToken: data.refreshToken,
      identifier: data.identifier,
      roles: data.roles ?? [],
      hasActiveShift: data.hasActiveShift ?? true,
      activeShiftRoleName: data.activeShiftRoleName ?? null,
    });

    return data.token;
  } catch {
    return null;
  }
}

interface ApiFetchOptions extends RequestInit {
  skipAuth?: boolean; // para endpoints públicos (login, register, etc.)
}

export async function fetchAuthed(
  url: string,
  options: ApiFetchOptions = {},
): Promise<Response> {
  const { skipAuth, headers, ...rest } = options;

  const token = skipAuth ? null : await getToken();

  const finalHeaders = {
    "Content-Type": "application/json",
    Accept: "*/*",
    // Evita la página de advertencia ("Continue anyway") de Dev Tunnels
    "X-Tunnel-Skip-AntiPhishing-Page": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  let res = await fetchWithRetry(url, { ...rest, headers: finalHeaders });

  // 401 = token vencido. 403 = token válido pero con permisos/rol viejos
  // (por ejemplo, le revocaron un rol). En ambos casos renovamos UNA vez.
  if ((res.status === 401 || res.status === 403) && !skipAuth) {
    const newToken = await refreshAccessToken();

    if (newToken) {
      res = await fetchWithRetry(url, {
        ...rest,
        headers: { ...finalHeaders, Authorization: `Bearer ${newToken}` },
      });

      // Con el token renovado sigue sin permiso: la sesión quedó
      // desactualizada respecto al backend → login.
      if (res.status === 403) {
        await clearSession();
        notifySessionExpired("role_revoked");
      }
    } else {
      // El refresh falló (o detectó rol revocado y ya cerró la sesión)
      await clearSession();
      notifySessionExpired(res.status === 403 ? "role_revoked" : "expired");
    }
  }

  return res;
}

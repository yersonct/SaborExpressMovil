import {
  getToken,
  getRefreshToken,
  saveSession,
  loadSession,
  clearSession,
} from "./tokenStorage";
import { AUTH_ENDPOINTS } from "./authEndpoints";
import { notifySessionExpired } from "./authEvents";
import { isServerDownStatus } from "./serverHealth";
import { ROLE_NAMES } from "../types/role";
import { getApiLanguage } from "./apiLanguage";
import {
  isNetworkFailure,
  reportNetworkAvailable,
  toUserFacingNetworkError,
} from "@/features/shared/services/networkStatus";

const OPERATIVE_ROLES: string[] = [
  ROLE_NAMES.Mesero,
  ROLE_NAMES.Cajero,
  ROLE_NAMES.Cocinero,
  ROLE_NAMES.Repartidor,
  ROLE_NAMES.AuxiliarCocina,
];

// Todos los que pidan renovar el token (fetchAuthed, SignalR) comparten UNA sola llamada.
let refreshPromise: Promise<string | null> | null = null;
// Evita pedir dos veces el mismo GET si varias pantallas/hooks se actualizan juntos.
// Las respuestas no se guardan: cada nueva carga posterior consulta al servidor.
const inFlightGetRequests = new Map<string, Promise<Response>>();
// La indisponibilidad temporal de la API no invalida una sesion local.

function isServerUnavailableError(error: unknown): boolean {
  if (isNetworkFailure(error)) return true;
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; code?: unknown; statusCode?: unknown };
  return (
    candidate.name === "NetworkUnavailableError" ||
    candidate.code === "NETWORK_UNAVAILABLE" ||
    (typeof candidate.statusCode === "number" && isServerDownStatus(candidate.statusCode))
  );
}

async function handleServerUnavailableError(error: unknown): Promise<void> {
  // Solo se cierra sesión ante rechazo explícito de autenticación
  // (401, refresh token revocado, etc.), nunca por una falla de conexión.
  if (isNetworkFailure(error)) {
    toUserFacingNetworkError(error);
  }
}

// Reintenta solo ante fallas de red reales (tunnel no listo, wifi cortado, etc.)
// No reintenta ante 401/500/etc., esos ya son respuestas válidas del servidor.
async function fetchWithRetry(
  input: RequestInfo,
  init: RequestInit,
): Promise<Response> {
  const method = (init.method ?? "GET").toUpperCase();
  const canRetry = ["GET", "HEAD", "OPTIONS"].includes(method);

  try {
    const response = await fetch(input, init);
    reportNetworkAvailable();
    return response;
  } catch (err) {
    if (init.signal?.aborted) throw err;
    if (canRetry && isNetworkFailure(err) && !init.signal?.aborted) {
      await new Promise((res) => setTimeout(res, 300));
      try {
        const response = await fetch(input, init);
        reportNetworkAvailable();
        return response;
      } catch (retryError) {
        if (init.signal?.aborted) throw retryError;
        throw toUserFacingNetworkError(retryError);
      }
    }
    throw toUserFacingNetworkError(err);
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
  const refreshTokenIsCurrent = async () => (await getRefreshToken()) === refreshToken;

  try {
    const res = await fetchWithRetry(AUTH_ENDPOINTS.refreshToken, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Language": getApiLanguage(),
        "X-Tunnel-Skip-AntiPhishing-Page": "true",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      if (isServerDownStatus(res.status)) {
        const error = new Error("El servicio no está disponible.");
        Object.assign(error, { statusCode: res.status });
        throw error;
      }
      if (res.status >= 500) {
        const error = new Error("El servidor no pudo renovar la sesión.");
        Object.assign(error, { statusCode: res.status });
        throw error;
      }
      // El servidor rechazó las credenciales de renovación. Por ejemplo,
      // otro inicio de sesión revocó este refresh token. No dejes la sesión
      // local activa: al iniciar o renovar en segundo plano no pasa por
      // executeAuthedRequest, así que el cierre debe ocurrir aquí también.
      if ((res.status === 401 || res.status === 403) && (await refreshTokenIsCurrent())) {
        await clearSession();
        notifySessionExpired(res.status === 403 ? "role_revoked" : "expired");
      }
      return null;
    }

    const data = await res.json();

    // Si antes tenía un rol operativo y el backend ya no lo devuelve,
    // el rol fue revocado: cerramos sesión (el usuario debe volver al login).
    // No sobrescribir una sesión nueva si este refresh respondió tarde.
    if (!(await refreshTokenIsCurrent())) return await getToken();

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
    if (!(await refreshTokenIsCurrent())) return await getToken();
    await saveSession({
      token: data.token,
      refreshToken: data.refreshToken,
      identifier: data.identifier,
      roles: data.roles ?? [],
      hasActiveShift: data.hasActiveShift ?? true,
      activeShiftRoleName: data.activeShiftRoleName ?? null,
    });

    return data.token;
  } catch (error) {
    await handleServerUnavailableError(error);
    const statusCode = (error as { statusCode?: unknown })?.statusCode;
    if (
      isServerUnavailableError(error) ||
      (typeof statusCode === "number" && statusCode >= 500)
    ) {
      throw error;
    }
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
    "Accept-Language": getApiLanguage(),
    // Evita la página de advertencia ("Continue anyway") de Dev Tunnels
    "X-Tunnel-Skip-AntiPhishing-Page": "true",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...headers,
  };

  const method = (rest.method ?? "GET").toUpperCase();
  const canShareRead =
    method === "GET" &&
    rest.body == null &&
    !rest.signal &&
    !headers &&
    !rest.cache;
  const requestKey = `${token ?? "anonymous"}\n${getApiLanguage()}\n${url}`;

  if (canShareRead) {
    const inFlight = inFlightGetRequests.get(requestKey);
    if (inFlight) return (await inFlight).clone();
  }

  const request = executeAuthedRequest(url, rest, finalHeaders, !!skipAuth);
  if (canShareRead) inFlightGetRequests.set(requestKey, request);

  try {
    return await request;
  } finally {
    if (canShareRead && inFlightGetRequests.get(requestKey) === request) {
      inFlightGetRequests.delete(requestKey);
    }
  }
}

async function executeAuthedRequest(
  url: string,
  rest: RequestInit,
  finalHeaders: HeadersInit,
  skipAuth: boolean,
): Promise<Response> {
  let res: Response;
  try {
    res = await fetchWithRetry(url, { ...rest, headers: finalHeaders });
  } catch (err) {
    if (!skipAuth) await handleServerUnavailableError(err);
    throw err;
  }

  if (!skipAuth && isServerDownStatus(res.status)) {
    // El fallo 502/503/504 puede ser temporal. Conservar la sesión.
    return res;
  }

  // Renueva ante 401 y 403 para actualizar claims de rol si cambiaron.
  // El propio recurso puede devolver 403 por permisos insuficientes; eso no
  // significa que la sesión completa deba cerrarse.
  if ((res.status === 401 || res.status === 403) && !skipAuth) {
    let newToken: string | null;
    try {
      newToken = await refreshAccessToken();
    } catch (error) {
      await handleServerUnavailableError(error);
      throw error;
    }

    if (newToken) {
      try {
        res = await fetchWithRetry(url, {
          ...rest,
          headers: { ...finalHeaders, Authorization: `Bearer ${newToken}` },
        });
      } catch (error) {
        await handleServerUnavailableError(error);
        throw error;
      }

      if (isServerDownStatus(res.status)) {
        // Error temporal del backend: sin borrar credenciales locales.
        return res;
      }

      // Si el backend rechaza también el token renovado con 401, la sesión ya
      // no es válida. Un 403 puede ser una denegación propia del endpoint; los
      // roles revocados ya se detectan al comparar la respuesta de renovación.
      if (res.status === 401) {
        await clearSession();
        notifySessionExpired("expired");
      }
    } else {
      // doRefresh ya cierra y notifica si el refresh token fue rechazado.
      // Si no hay refresh token, solo un 401 confirma que la sesión venció;
      // un 403 por permisos no debe expulsar al usuario.
      if (res.status === 401 && (await loadSession())) {
        await clearSession();
        notifySessionExpired("expired");
      }
    }
  }

  return res;
}

import { AUTH_ENDPOINTS } from "./authEndpoints";
import { getToken } from "./tokenStorage";
import { getApiLanguage } from "./apiLanguage";

export async function logout(): Promise<void> {
  const token = await getToken();

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 3000);

  try {
    await fetch(AUTH_ENDPOINTS.logout, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        "Accept-Language": getApiLanguage(),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
  } catch {
    // Si el servidor no responde, no bloqueamos el logout local.
    // El usuario igual debe poder salir de la app.
  } finally {
    clearTimeout(timeoutId);
  }
}

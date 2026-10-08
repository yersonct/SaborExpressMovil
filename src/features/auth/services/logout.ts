import { AUTH_ENDPOINTS } from "./authEndpoints";
import { getToken } from "./tokenStorage";

export async function logout(): Promise<void> {
  const token = await getToken();

  try {
    await fetch(AUTH_ENDPOINTS.logout, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "*/*",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
    });
  } catch {
    // Si el servidor no responde, no bloqueamos el logout local.
    // El usuario igual debe poder salir de la app.
  }
}

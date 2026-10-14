import { API_BASE_URL } from "@/config/api";
import { fetchWithNetworkHandling } from "@/features/shared/services/networkStatus";

const DOWN_STATUSES = [502, 503, 504];

export function isServerDownStatus(status: number): boolean {
  return DOWN_STATUSES.includes(status);
}

// true = el back responde bien. Cualquier error de red, timeout o
// respuesta que no sea 2xx se considera "servicio caído".
export async function isServerAlive(timeoutMs = 5000): Promise<boolean> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetchWithNetworkHandling(`${API_BASE_URL}/health`, {
      method: "GET",
      headers: { "X-Tunnel-Skip-AntiPhishing-Page": "true" },
      signal: controller.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timer);
  }
}

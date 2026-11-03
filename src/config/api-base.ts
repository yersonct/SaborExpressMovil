export function normalizeApiBaseUrl(value: string | undefined, production = false): string {
  if (!value?.trim()) throw new Error("Configura EXPO_PUBLIC_API_URL en el archivo .env antes de iniciar SaborExpress.");
  let url: URL;
  try { url = new URL(value.trim()); }
  catch { throw new Error("EXPO_PUBLIC_API_URL debe ser una URL HTTP o HTTPS válida."); }
  if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.search || url.hash || url.pathname !== "/")
    throw new Error("EXPO_PUBLIC_API_URL debe contener solo el origen del servidor, sin /api, credenciales ni parámetros.");
  if (production && url.protocol !== "https:") throw new Error("Producción requiere EXPO_PUBLIC_API_URL con HTTPS.");
  return url.origin;
}

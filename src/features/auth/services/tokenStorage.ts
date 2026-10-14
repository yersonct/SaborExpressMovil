import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AuthResponse } from "../types";

const TOKEN_KEY = "saborexpress_token";
const REFRESH_KEY = "saborexpress_refresh_token";
const USER_KEY = "saborexpress_user";

const isWeb = Platform.OS === "web";

// SecureStore es asÃ­ncrono: reutiliza el token en memoria y comparte la primera lectura.
let cachedAccessToken: string | null | undefined;
let accessTokenRead: Promise<string | null> | null = null;
let accessTokenVersion = 0;

async function setItem(key: string, value: string): Promise<void> {
  if (isWeb) {
    localStorage.setItem(key, value);
  } else {
    await SecureStore.setItemAsync(key, value);
  }
}

async function getItem(key: string): Promise<string | null> {
  if (isWeb) {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function deleteItem(key: string): Promise<void> {
  if (isWeb) {
    localStorage.removeItem(key);
  } else {
    await SecureStore.deleteItemAsync(key);
  }
}

export async function saveSession(session: AuthResponse) {
  await Promise.all([
    setItem(TOKEN_KEY, session.token),
    setItem(REFRESH_KEY, session.refreshToken ?? ""),
    setItem(USER_KEY, JSON.stringify(session)),
  ]);
  accessTokenVersion += 1;
  cachedAccessToken = session.token;
}

export async function loadSession(): Promise<AuthResponse | null> {
  const userJson = await getItem(USER_KEY);
  if (!userJson) return null;

  try {
    const parsed = JSON.parse(userJson);
    // Validamos que tenga la forma real esperada; si no, la sesión es inválida.
    if (!parsed?.identifier || !Array.isArray(parsed?.roles)) {
      await clearSession();
      return null;
    }
    return parsed as AuthResponse;
  } catch {
    await clearSession();
    return null;
  }
}

export async function clearSession() {
  accessTokenVersion += 1;
  cachedAccessToken = null;
  await Promise.all([
    deleteItem(TOKEN_KEY),
    deleteItem(REFRESH_KEY),
    deleteItem(USER_KEY),
  ]);
}

export async function getToken(): Promise<string | null> {
  if (cachedAccessToken !== undefined) return cachedAccessToken;
  if (accessTokenRead) return accessTokenRead;

  const versionAtStart = accessTokenVersion;
  const read = getItem(TOKEN_KEY)
    .then((token) => {
      // No reemplaza un token nuevo si la sesiÃ³n cambiÃ³ durante esta lectura.
      if (versionAtStart !== accessTokenVersion) return cachedAccessToken ?? null;
      cachedAccessToken = token;
      return token;
    })
    .finally(() => {
      if (accessTokenRead === read) accessTokenRead = null;
    });

  accessTokenRead = read;
  return read;
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

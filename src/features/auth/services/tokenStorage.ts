import { Platform } from "react-native";
import * as SecureStore from "expo-secure-store";
import type { AuthResponse } from "../types";

const TOKEN_KEY = "saborexpress_token";
const REFRESH_KEY = "saborexpress_refresh_token";
const USER_KEY = "saborexpress_user";

const isWeb = Platform.OS === "web";

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
  await setItem(TOKEN_KEY, session.token);
  await setItem(REFRESH_KEY, session.refreshToken ?? "");
  await setItem(USER_KEY, JSON.stringify(session));
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
  await deleteItem(TOKEN_KEY);
  await deleteItem(REFRESH_KEY);
  await deleteItem(USER_KEY);
}

export async function getToken(): Promise<string | null> {
  return getItem(TOKEN_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getItem(REFRESH_KEY);
}

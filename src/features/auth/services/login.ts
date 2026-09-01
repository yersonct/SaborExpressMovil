import type { LoginCredentials, AuthResponse } from '../types';
import { handleResponse } from './handleResponse';
import { AUTH_ENDPOINTS } from './authEndpoints';

export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 6000); // 8s

  try {
    const res = await fetch(AUTH_ENDPOINTS.login, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': '*/*',
        'X-DevTunnels-Skip-Browser-Warning': 'true'
      },
      body: JSON.stringify(credentials),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    const raw = await handleResponse<any>(res);
    return {
      token: raw.token,
      user: { identifier: raw.identifier, roleId: raw.roleId }
    };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw { message: 'La solicitud tardó demasiado. Revisa tu conexión.', statusCode: 408 };
    }
    throw err;
  }
}
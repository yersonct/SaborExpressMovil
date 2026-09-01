import { AUTH_ENDPOINTS } from './authEndpoints';

export async function logout(): Promise<void> {
  await fetch(AUTH_ENDPOINTS.logout, {
    method: 'POST',
    credentials: 'include',
  });
}
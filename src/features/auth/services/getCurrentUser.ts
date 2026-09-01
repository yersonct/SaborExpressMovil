import type { User } from '../types';
import { AUTH_ENDPOINTS } from './authEndpoints';

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetch(AUTH_ENDPOINTS.me, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}
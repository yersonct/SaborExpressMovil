import type { User } from '../types';
import { AUTH_ENDPOINTS } from './authEndpoints';
import { fetchWithNetworkHandling } from '@/features/shared/services/networkStatus';

export async function getCurrentUser(): Promise<User | null> {
  const res = await fetchWithNetworkHandling(AUTH_ENDPOINTS.me, {
    credentials: 'include',
  });
  if (!res.ok) return null;
  return res.json();
}

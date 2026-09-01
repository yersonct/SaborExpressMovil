import type { ClientRegisterData, AuthResponse } from '../types';
import { handleResponse } from './handleResponse';
import { AUTH_ENDPOINTS } from './authEndpoints';

export async function registerClient(data: ClientRegisterData): Promise<AuthResponse> {
  const res = await fetch(AUTH_ENDPOINTS.registerClient, {
    method: 'POST',
    headers: { 
   'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-DevTunnels-Skip-Browser-Warning': 'true'
    },
    // Le agregamos el roleId: 1 al JSON que viaja hacia C#
    body: JSON.stringify({
      ...data,
      roleId: 1 
    }),
  });
  
  const raw = await handleResponse<any>(res);

  // Devolvemos el mismo formato de éxito que en el login
  return {
    token: raw.token,
    user: {
      identifier: raw.identifier,
      roleId: raw.roleId
    }
  };
}
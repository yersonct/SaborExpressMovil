import type { WorkerRegisterData, AuthResponse } from '../types';
import { handleResponse } from './handleResponse';
import { AUTH_ENDPOINTS } from './authEndpoints';

export async function registerWorker(data: any): Promise<AuthResponse> {
  const res = await fetch(AUTH_ENDPOINTS.registerClient, { // Apunta a /api/Auth/register
    method: 'POST',
    headers: { 
     'Content-Type': 'application/json',
      'Accept': '*/*',
      'X-DevTunnels-Skip-Browser-Warning': 'true'
    },
    // Enviamos los datos exactos que exige el DTO de C#
    body: JSON.stringify(data), 
  });
  
  const raw = await handleResponse<any>(res);

  return {
    token: raw.token,
    user: {
      identifier: raw.identifier,
      roleId: raw.roleId
    }
  };
}
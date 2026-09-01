// export const BASE_URL = 'http://192.168.101.10:5000/api/Auth';
export const BASE_URL = 'http://localhost:8080/api/Auth';
// export const BASE_URL = 'https://vq6dzcms-5000.use2.devtunnels.ms/api/Auth';

export const AUTH_ENDPOINTS = {
  login: `${BASE_URL}/login`,
  registerClient: `${BASE_URL}/register`,
  registerWorker: `${BASE_URL}/register`,
  logout: `${BASE_URL}/logout`,
  me: `${BASE_URL}/me`,
} as const;
import type { ApiError } from '../types';

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const errorData: ApiError = await res.json().catch(() => ({
      message: 'Error de red o del servidor',
      statusCode: res.status,
    }));
    throw errorData;
  }
  return res.json();
}
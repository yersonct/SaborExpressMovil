import type { ApiError } from "../types";

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);

    const errorData: ApiError = {
      message: body?.error ?? body?.message ?? "Error de red o del servidor",
      statusCode: res.status,
      code: body?.code,
    };

    throw errorData;
  }
  return res.json();
}

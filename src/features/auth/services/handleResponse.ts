import type { ApiError } from "../types";
import { getApiLanguage } from "./apiLanguage";

const HTTP_ERROR_MESSAGES = {
  es: {
    expired: "Tu sesión venció. Inicia sesión de nuevo.",
    forbidden: "No tienes permisos para realizar esta acción.",
    server: "El servidor no pudo completar la solicitud.",
    request: "No se pudo completar la solicitud.",
  },
  en: {
    expired: "Your session expired. Please sign in again.",
    forbidden: "You do not have permission to perform this action.",
    server: "The server could not complete the request.",
    request: "The request could not be completed.",
  },
  pt: {
    expired: "Sua sessão expirou. Entre novamente.",
    forbidden: "Você não tem permissão para realizar esta ação.",
    server: "O servidor não conseguiu concluir a solicitação.",
    request: "Não foi possível concluir a solicitação.",
  },
  fr: {
    expired: "Votre session a expiré. Reconnectez-vous.",
    forbidden: "Vous n’avez pas l’autorisation d’effectuer cette action.",
    server: "Le serveur n’a pas pu traiter la demande.",
    request: "La demande n’a pas pu être traitée.",
  },
} as const;

export async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => null);
    const validationMessage = body?.errors
      ? Object.values(body.errors)
          .flat()
          .find((message): message is string => typeof message === "string")
      : undefined;
    const messages = HTTP_ERROR_MESSAGES[getApiLanguage()];
    const statusMessage = res.status === 401
      ? messages.expired
      : res.status === 403
        ? messages.forbidden
        : res.status >= 500
          ? messages.server
          : messages.request;

    const errorData: ApiError = {
      message:
        body?.error ??
        body?.message ??
        body?.detail ??
        validationMessage ??
        statusMessage,
      statusCode: res.status,
      code: body?.code,
    };

    throw errorData;
  }
  return res.json();
}

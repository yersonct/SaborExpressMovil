import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";
import type { ApiLanguage } from "@/features/auth/services/apiLanguage";

const languageUrl = `${API_BASE_URL}/api/user-preferences/language`;

export async function getUserLanguagePreference(): Promise<{
  language: ApiLanguage;
  isConfigured: boolean;
}> {
  const response = await fetchAuthed(languageUrl);
  if (!response.ok) throw new Error("No se pudo cargar el idioma.");
  const result = await response.json() as { language?: unknown; isConfigured?: unknown };
  const language = typeof result.language === "string"
    ? result.language.toLowerCase().split(/[-_]/, 1)[0]
    : "";
  if (!(language === "es" || language === "en" || language === "pt" || language === "fr")) {
    throw new Error("El idioma guardado no es válido.");
  }
  return { language, isConfigured: result.isConfigured === true };
}

export async function saveUserLanguagePreference(language: ApiLanguage): Promise<void> {
  const response = await fetchAuthed(languageUrl, {
    method: "PUT",
    body: JSON.stringify({ language }),
  });
  if (!response.ok) throw new Error("No se pudo guardar el idioma.");
}

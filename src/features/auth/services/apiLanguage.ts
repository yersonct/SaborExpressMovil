export type ApiLanguage = "es" | "en" | "pt" | "fr";

const supportedLanguages = new Set<ApiLanguage>(["es", "en", "pt", "fr"]);
let currentLanguage: ApiLanguage = "es";

export function setApiLanguage(language: unknown): void {
  if (typeof language !== "string") return;
  const normalized = language.toLowerCase().split(/[-_]/, 1)[0] as ApiLanguage;
  if (supportedLanguages.has(normalized)) currentLanguage = normalized;
}

export function getApiLanguage(): ApiLanguage {
  return currentLanguage;
}

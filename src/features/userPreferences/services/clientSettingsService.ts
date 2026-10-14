import { API_BASE_URL } from "@/config/api";
import { fetchAuthed } from "@/features/auth/services/apiClient";

export type ClientSettings = {
  theme: "light" | "dark" | "system";
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundNotifications: boolean;
  timeZone: string;
  updatedAt: string | null;
  isDefault: boolean;
};

export type ClientSettingsUpdate = Pick<
  ClientSettings,
  "theme" | "emailNotifications" | "pushNotifications" | "soundNotifications" | "timeZone"
>;

const settingsUrl = `${API_BASE_URL}/api/user-settings/me`;
const languageUrl = `${API_BASE_URL}/api/user-preferences/language`;

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || "No se pudo guardar la configuración.");
  }
  return response.json() as Promise<T>;
}

export const clientSettingsService = {
  getSettings: async () => readJson<ClientSettings>(await fetchAuthed(settingsUrl)),
  updateSettings: async (settings: ClientSettingsUpdate) =>
    readJson<ClientSettings>(
      await fetchAuthed(settingsUrl, {
        method: "PUT",
        body: JSON.stringify(settings),
      }),
    ),
  getLanguage: async () =>
    readJson<{ language: string; isConfigured: boolean }>(await fetchAuthed(languageUrl)),
  updateLanguage: async (language: string) =>
    readJson<{ language: string }>(
      await fetchAuthed(languageUrl, {
        method: "PUT",
        body: JSON.stringify({ language }),
      }),
    ),
};

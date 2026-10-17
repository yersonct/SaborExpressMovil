export type AppLanguage = "es" | "en" | "pt" | "fr";

const offlineMessages: Record<AppLanguage, string> = {
  es: "No se pudo conectar con SaborExpress. Comprueba que el servidor esté disponible e inténtalo de nuevo.",
  en: "No internet connection. Check your signal and try again.",
  pt: "Sem conexão com a internet. Verifique seu sinal e tente novamente.",
  fr: "Pas de connexion Internet. Vérifiez votre réseau et réessayez.",
};

type Listener = (message: string | null) => void;
const listeners = new Set<Listener>();
type NetworkRecoveryListener = () => void;
const recoveryListeners = new Set<NetworkRecoveryListener>();
let activeLanguage: AppLanguage = "es";
let offline = false;

function notifyListeners() {
  const message = offline ? offlineMessages[activeLanguage] : null;
  listeners.forEach((listener) => listener(message));
}

export function setNetworkErrorLanguage(language: AppLanguage) {
  activeLanguage = language;
  if (offline) notifyListeners();
}

export function subscribeToNetworkStatus(listener: Listener) {
  listeners.add(listener);
  listener(offline ? offlineMessages[activeLanguage] : null);
  return () => {
    listeners.delete(listener);
  };
}

export function subscribeToNetworkRecovery(listener: NetworkRecoveryListener) {
  recoveryListeners.add(listener);
  return () => {
    recoveryListeners.delete(listener);
  };
}

export function isNetworkFailure(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const candidate = error as { name?: unknown; message?: unknown };
  if (candidate.name === "AbortError") return false;

  const description = `${candidate.name ?? ""} ${candidate.message ?? ""}`.toLowerCase();
  return /failed to fetch|fetch failed|network request failed|networkerror|unknownhostexception|unable to resolve host|no address associated with hostname|enotfound|econnrefused|ehostunreach|network is unreachable|internet.*disconnected|err_internet_disconnected|connection.*(lost|refused|reset|unavailable|timed out)|socket hang up|failed to connect|could not connect|name resolution|dns.*(fail|error)/.test(
    description,
  );
}

export function toUserFacingNetworkError(error: unknown): unknown {
  if (!isNetworkFailure(error)) return error;

  offline = true;
  notifyListeners();

  const friendlyError = new Error(offlineMessages[activeLanguage]);
  friendlyError.name = "NetworkUnavailableError";
  Object.assign(friendlyError, { code: "NETWORK_UNAVAILABLE", statusCode: 0 });
  return friendlyError;
}

export function reportNetworkAvailable() {
  if (!offline) return;
  offline = false;
  notifyListeners();
  recoveryListeners.forEach((listener) => {
    try {
      listener();
    } catch {
      // La recuperación de una pantalla no debe afectar a las demás.
    }
  });
}

export async function fetchWithNetworkHandling(
  input: RequestInfo,
  init?: RequestInit,
): Promise<Response> {
  try {
    const response = await fetch(input, init);
    reportNetworkAvailable();
    return response;
  } catch (error) {
    if (init?.signal?.aborted) throw error;
    throw toUserFacingNetworkError(error);
  }
}


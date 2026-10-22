import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { AppState } from "react-native";
import { router } from "expo-router";
import type { LoginCredentials, ApiError, AuthResponse } from "../types";
import { authService } from "../services/authService";
import { ROLE_NAMES } from "../types/role";
import {
  saveSession,
  loadSession,
  clearSession,
  getToken,
} from "../services/tokenStorage";
import {
  setSessionExpiredHandler,
  setSessionUpdatedHandler,
  notifySessionExpired,
} from "../services/authEvents";
import { refreshAccessToken , fetchAuthed } from "../services/apiClient";

import { AUTH_ENDPOINTS } from "../services/authEndpoints";
import { isServerAlive } from "../services/serverHealth";
import { startBackendRecoveryWatch, stopBackendRecoveryWatch } from "@/features/shared/services/backendRecoveryWatch";
import { getApiLanguage } from "../services/apiLanguage";
import { getEmployeeIdFromToken, decodeToken } from "../services/decodeToken";
import * as signalR from "@microsoft/signalr";
import { API_BASE_URL } from "@/config/api";
import { scheduleService } from "@/features/employeeSchedules/services/scheduleService";
import { unregisterWaiterPushDevice } from "@/features/notifications/services/pushDeviceService";
import {
  reportNetworkAvailable,
  toUserFacingNetworkError,
} from "@/features/shared/services/networkStatus";
import {
  emitRealtimeEvent,
  REALTIME_HUB_EVENTS,
  REALTIME_CONNECTED,
  registerRealtimeInvoker,
  setRealtimeConnectionState,
} from "@/features/shared/services/realtimeEvents";

const OFF_SHIFT_RECHECK_MS = 5 * 60 * 1000;

function millisecondsUntilColombiaTime(time: string): number | null {
  const [hours, minutes, seconds = "0"] = time.split(":");
  const values = [hours, minutes, seconds].map(Number);
  if (values.some((value) => !Number.isInteger(value))) return null;

  // Colombia mantiene UTC-5; el cálculo no depende de la zona horaria del móvil.
  const colombiaNow = new Date(Date.now() - 5 * 60 * 60 * 1000);
  const targetWallTime = Date.UTC(
    colombiaNow.getUTCFullYear(),
    colombiaNow.getUTCMonth(),
    colombiaNow.getUTCDate(),
    values[0],
    values[1],
    values[2],
  );
  return targetWallTime - colombiaNow.getTime();
}

interface AuthContextValue {
  user: AuthResponse | null;
  loading: boolean;
  initializing: boolean;
  error: string | null;
  errorCode: string | null;
  pendingIdentifier: string;
  handleLogin: (identifier: string, password: string) => Promise<void>;
  handleLogout: () => Promise<void>;
  clearError: () => void;
}
const ALLOWED_MOBILE_ROLES: string[] = [
  ROLE_NAMES.Cliente,
  ROLE_NAMES.Mesero,
  ROLE_NAMES.Cajero,
  ROLE_NAMES.Repartidor,
  ROLE_NAMES.Cocinero,
  ROLE_NAMES.AuxiliarCocina,
];
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pendingIdentifier, setPendingIdentifier] = useState("");

  const refreshShiftStatus = useCallback(async (session: AuthResponse) => {
    const employeeId = getEmployeeIdFromToken(session.token);
    if (!employeeId) return null;

    const shift = await scheduleService.getCurrentShift(employeeId);
    if (!shift) return null;

    const currentSession = await loadSession();
    if (!currentSession || getEmployeeIdFromToken(currentSession.token) !== employeeId) return null;

    const updated: AuthResponse = {
      ...currentSession,
      hasActiveShift: shift.hasActiveShift,
      activeShiftRoleName: shift.hasActiveShift ? shift.roleName : null,
    };

    setUser(updated);
    await saveSession(updated);
    return shift;
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        // Muestra enseguida la sesión local; la validación remota sigue después.
        setUser(session);
        setInitializing(false);

        if (session) {
          if (!(await isServerAlive(3000))) {
            // Contrato solicitado: si el servicio está caído, volver al login.
            notifySessionExpired("server_down");
            return;
          }

          setUser(session);
          const hasOperativeRole = session.roles.some(
            (role) => role !== ROLE_NAMES.Cliente,
          );
          const storedToken = await getToken();
          const decodedToken = storedToken ? decodeToken(storedToken) : null;
          const tokenExpiresSoon =
            !decodedToken || decodedToken.exp * 1000 <= Date.now() + 60_000;

          if (hasOperativeRole && tokenExpiresSoon) {
            try {
              await refreshAccessToken();
            } catch {
              // El cliente de API cierra la sesión si confirma que ya no es válida.
            }
          }

          const fresh = await loadSession();
          if (fresh) {
            setUser(fresh);
            await refreshShiftStatus(fresh);
          }
        }
      } catch (error) {
        if (__DEV__) console.warn("[Auth] No se pudo restaurar la sesión:", error);
      } finally {
        setInitializing(false);
      }
    })();
  }, [refreshShiftStatus]);



  const userToken = user?.token;

  // Actualiza la sesión en el límite del turno y al volver a abrir la app.
  useEffect(() => {
    if (!userToken) return;
    const employeeId = getEmployeeIdFromToken(userToken);
    if (!employeeId) return;

    let disposed = false;
    let checking = false;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      if (disposed || checking) return;
      checking = true;
      try {
        const session = await loadSession();
        if (!session || getEmployeeIdFromToken(session.token) !== employeeId) return;

        const shift = await refreshShiftStatus(session);
        if (disposed) return;
        const untilEnd = shift?.hasActiveShift && shift.endTime
          ? millisecondsUntilColombiaTime(shift.endTime)
          : null;
        const nextCheck = untilEnd !== null && untilEnd > 0
          ? untilEnd + 500
          : OFF_SHIFT_RECHECK_MS;
        timer = setTimeout(() => { void check(); }, nextCheck);
      } finally {
        checking = false;
      }
    };

    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || disposed) return;
      if (timer) clearTimeout(timer);
      timer = null;
      void check();
    });

    void check();
    return () => {
      disposed = true;
      if (timer) clearTimeout(timer);
      appStateSub.remove();
    };
  }, [userToken, refreshShiftStatus]);

  useEffect(() => {
    setSessionUpdatedHandler(setUser);
    return () => setSessionUpdatedHandler(null);
  }, []);
  useEffect(() => {
    setSessionExpiredHandler(async (reason) => {
      if (__DEV__) console.info("[Auth] Sesión finalizada:", reason);
      await clearSession();
      setUser(null);
      if (reason === "role_revoked") {
        setError("Tu rol fue modificado. Inicia sesión de nuevo.");
      } else if (reason === "expired") {
        setError("Tu sesión venció o dejó de ser válida. Inicia sesión de nuevo.");
      } else if (reason === "server_down") {
        startBackendRecoveryWatch();
        setError(
          "No se pudo conectar con el servicio del sistema. Revisa la conexión o inténtalo más tarde.",
        );
        setErrorCode("SERVER_DOWN");
      } else if (reason === "shift_changed") {
        setError("Tu turno, rol o sede fue modificado. Inicia sesión de nuevo.");
      } else if (reason === "another_device") {
        setError(
          "Esta cuenta inició sesión en otro dispositivo. Inicia sesión de nuevo para continuar.",
        );
      }
      // Cierra todas las pantallas y manda al login
      try {
        router.replace("/");
      } catch {}
    });
  }, []);

  const hasSession = !!user;

  // El hub avisa si cambió el turno/rol o si otra sesión tomó la cuenta.
  // En ambos casos cerramos esta sesión y volvemos al login.
  useEffect(() => {
    if (!hasSession) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/notifications`, {
        accessTokenFactory: async () => {
          const token = await getToken();
          if (!token) return "";
          const decoded = decodeToken(token);
          const expiring = !decoded || decoded.exp * 1000 < Date.now() + 10000;
          if (expiring) return (await refreshAccessToken()) ?? "";
          return token;
        },
        withCredentials: false,
        headers: {
          "X-Tunnel-Skip-AntiPhishing-Page": "true",
          "Accept-Language": getApiLanguage(),
        },
      })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.None)
      .build();

    const unregisterRealtimeInvoker = registerRealtimeInvoker(
      async (method, ...args) => {
        if (connection.state !== signalR.HubConnectionState.Connected) {
          throw new Error("El canal en tiempo real no está conectado.");
        }
        await connection.invoke(method, ...args);
      },
    );

    REALTIME_HUB_EVENTS.forEach((eventName) => {
      connection.on(eventName, (...args: unknown[]) => {
        emitRealtimeEvent(eventName, ...args);
      });
    });

    connection.on("ForceLogout", () => {
      notifySessionExpired("shift_changed");
    });
    connection.on("SessionReplaced", () => {
      notifySessionExpired("another_device");
    });

    let disposed = false;
    let starting = false;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let healthCheckInProgress = false;

    const checkBackendAfterConnectionFailure = async (error?: Error) => {
      if (error) toUserFacingNetworkError(error);
      if (disposed || healthCheckInProgress) return;

      healthCheckInProgress = true;
      try {
        if (!(await isServerAlive(4000)) && !disposed) {
          // Si falla el servicio, el monitor HTTP confirmará el cierre.
          setRealtimeConnectionState(false);
        } else if (!disposed) {
          // SignalR puede rechazar el JWT con 401 al reconectar después de que
          // otro dispositivo inició sesión. Valida por HTTP para que apiClient
          // renueve o cierre la sesión local aunque no haya llegado el evento.
          try {
            await fetchAuthed(AUTH_ENDPOINTS.session);
          } catch {
            // apiClient gestiona 401/403; los errores de red se reintentan abajo.
          }
        }
      } finally {
        healthCheckInProgress = false;
      }
    };

    const start = () => {
      if (
        disposed ||
        starting ||
        connection.state !== signalR.HubConnectionState.Disconnected
      ) return;
      starting = true;
      connection
        .start()
        .then(() => {
          reportNetworkAvailable();
          setRealtimeConnectionState(true);
          emitRealtimeEvent(REALTIME_CONNECTED);
        })
        .catch((error) => {
          if (disposed) return;
          setRealtimeConnectionState(false);
          void checkBackendAfterConnectionFailure(error).finally(() => {
            if (!disposed) retryTimer = setTimeout(start, 5000);
          });
        })
        .finally(() => {
          starting = false;
        });
    };
    connection.onreconnected(() => {
      reportNetworkAvailable();
      setRealtimeConnectionState(true);
      emitRealtimeEvent(REALTIME_CONNECTED);
    });
    connection.onreconnecting(() => {
      setRealtimeConnectionState(false);
    });
    connection.onclose((error) => {
      if (disposed) return;
      setRealtimeConnectionState(false);
      void checkBackendAfterConnectionFailure(error).finally(() => {
        if (!disposed) retryTimer = setTimeout(start, 5000);
      });
    });
    const appStateSub = AppState.addEventListener("change", (state) => {
      if (state !== "active" || disposed) return;
      if (connection.state === signalR.HubConnectionState.Connected) {
        setRealtimeConnectionState(true);
        emitRealtimeEvent(REALTIME_CONNECTED);
      } else {
        start();
      }
    });
    start();

    return () => {
      disposed = true;
      setRealtimeConnectionState(false);
      if (retryTimer) clearTimeout(retryTimer);
      appStateSub.remove();
      unregisterRealtimeInvoker();
      connection.stop();
    };
  }, [hasSession]);

  // SignalR puede permanecer en "Reconnecting" cuando el backend se apaga.
  // Un pulso HTTP independiente detecta incluso esa condición.
  useEffect(() => {
    if (!hasSession) return;
    let disposed = false;
    let failures = 0;
    let checking = false;
    let loggedOut = false;
    const check = async () => {
      if (disposed || checking || loggedOut) return;
      checking = true;
      try {
        const healthy = await isServerAlive(3500);
        if (disposed) return;
        failures = healthy ? 0 : failures + 1;
        // Dos comprobaciones consecutivas evitan cerrar por un paquete aislado.
        if (failures >= 2) {
          loggedOut = true;
          notifySessionExpired("server_down");
        }
      } finally {
        checking = false;
      }
    };
    const timer = setInterval(() => { void check(); }, 5000);
    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") void check();
    });
    void check();
    return () => { disposed = true; clearInterval(timer); appState.remove(); };
  }, [hasSession]);

  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  const handleLogin = async (identifier: string, password: string) => {
    setError(null);
    setErrorCode(null);

    if (!identifier || !password) {
      setError(!identifier ? "Ingresa tu correo electrónico." : "Ingresa tu contraseña.");
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginCredentials = { identifier, password };
      const response = await authService.login(credentials);

      const tieneAccesoMovil = response.roles.some((r) =>
        ALLOWED_MOBILE_ROLES.includes(r),
      );

      if (!tieneAccesoMovil) {
        setError(
          "Esta cuenta no tiene acceso a la app móvil. Usa el panel web de SaborExpress.",
        );
        setLoading(false);
        return;
      }

      stopBackendRecoveryWatch();
      await saveSession(response);
      setUser(response);
    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? "Ocurrió un error al iniciar sesión");
      setErrorCode(apiError.code ?? null);
      setPendingIdentifier(identifier);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Espera al servidor máximo 1.5 s; si no responde, sigue igual
      await Promise.race([
        (async () => {
          // Desregistra mientras el token aún permite llamar al endpoint.
          // Revocar la sesión en paralelo puede hacer que el backend rechace la baja.
          await unregisterWaiterPushDevice();
          await authService.logout();
        })(),
        new Promise((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {
      // el logout local no debe depender del servidor
    } finally {
      await clearSession();
      setUser(null);
      try {
        router.replace("/");
      } catch {}
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        initializing,
        error,
        errorCode,
        pendingIdentifier,
        handleLogin,
        handleLogout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de un AuthProvider");
  return ctx;
};

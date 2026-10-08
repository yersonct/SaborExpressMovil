import React, { createContext, useContext, useState, useEffect } from "react";
import type { LoginCredentials, ApiError, AuthResponse } from "../types";
import { authService } from "../services/authService";
import {
  saveSession,
  loadSession,
  clearSession,
} from "../services/tokenStorage";
import { setSessionExpiredHandler } from "../services/authEvents";
import { refreshAccessToken } from "../services/apiClient";
import { ROLE_NAMES } from "../types/role";
import { getEmployeeIdFromToken } from "../services/decodeToken";
import { scheduleService } from "@/features/employeeSchedules/services/scheduleService";

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

    useEffect(() => {
        (async () => {
        const session = await loadSession();
        if (session) {
          setUser(session);

          // Si tiene un rol operativo, pedimos roles frescos al backend.
          // Si le revocaron un rol, apiClient cierra la sesión y avisa
          // (el handler de abajo deja user = null y va al login).
          const hasOperativeRole = session.roles.some(
            (r) => r !== ROLE_NAMES.Cliente,
          );
          if (hasOperativeRole) {
            await refreshAccessToken();
          }

          const fresh = await loadSession(); // null si se cerró la sesión
          if (fresh) {
            setUser(fresh);
            await refreshShiftStatus(fresh);
          }
        }
        setInitializing(false);
        })();
    }, []);

    const refreshShiftStatus = async (session: AuthResponse) => {
      const employeeId = getEmployeeIdFromToken(session.token);
      if (!employeeId) return; // Cliente/Gerente/Administrador sin EmployeeId: no aplica

      const shift = await scheduleService.getCurrentShift(employeeId);
      if (!shift) return; // falló la consulta: seguimos con el valor cacheado

      const updated: AuthResponse = {
        ...session,
        hasActiveShift: shift.hasActiveShift,
        activeShiftRoleName: shift.roleName,
      };

      setUser(updated);
      await saveSession(updated);
    };
    useEffect(() => {
      setSessionExpiredHandler(async (reason) => {
        await clearSession();
        setUser(null);
        if (reason === "role_revoked") {
          setError("Tu rol fue modificado. Inicia sesión de nuevo.");
        }
      });
    }, []);
  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  const handleLogin = async (identifier: string, password: string) => {
    setError(null);
    setErrorCode(null);

    if (!identifier || !password) {
      setError("Por favor ingresa tu documento/correo y contraseña");
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
      await authService.logout();
    } finally {
      await clearSession();
      setUser(null);
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

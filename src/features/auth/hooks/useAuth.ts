import { useState } from "react";
import type { LoginCredentials, ApiError, AuthResponse } from "../types";
import { authService } from "../services/authService";

export const useAuth = () => {
  const [user, setUser] = useState<AuthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [pendingIdentifier, setPendingIdentifier] = useState<string>("");

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
      setUser(response);
      // TODO: guardar response.token y response.refreshToken de forma persistente
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
      setUser(null);
      // TODO: borrar el token guardado
    }
  };

  const clearError = () => {
    setError(null);
    setErrorCode(null);
  };

  return { user, loading, error, errorCode, pendingIdentifier, handleLogin, handleLogout, clearError };
  
};

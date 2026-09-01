import { useState } from 'react';
import type { LoginCredentials, ApiError, AuthResponse } from '../types'; // Importamos tu nuevo AuthResponse
import { authService } from '../services/authService';

export const useAuth = () => {
  // Cambiamos el tipo genérico 'User' por la parte 'user' de tu nueva interfaz
  const [user, setUser] = useState<AuthResponse['user'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (identifier: string, password: string) => {
    setError(null);

    if (!identifier || !password) {
      setError('Por favor ingresa tu documento/correo y contraseña');
      return;
    }

    setLoading(true);
    try {
      const credentials: LoginCredentials = { identifier, password };
      
      // authService.login ahora devuelve un objeto con 'user' y 'token'
      const { user: loggedUser, token } = await authService.login(credentials);
      
      setUser(loggedUser); // Guarda { identifier, roleId } en el estado

      // NOTA: Como estás en móvil, aquí deberías guardar el 'token' para que el usuario no pierda la sesión
      // Ejemplo si usas Expo SecureStore:
      // await SecureStore.setItemAsync('userToken', token);

    } catch (err) {
      const apiError = err as ApiError;
      setError(apiError.message ?? 'Ocurrió un error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      setUser(null);
      // NOTA: Aquí deberías borrar el token del almacenamiento
      // Ejemplo: await SecureStore.deleteItemAsync('userToken');
    }
  };

  return { user, loading, error, handleLogin, handleLogout };
};
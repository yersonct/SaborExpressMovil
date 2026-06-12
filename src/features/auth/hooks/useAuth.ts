
import { useState } from 'react';
import { User } from '../types';
import { authService } from '../services/authService'; 

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (username: string, password?: string) => {
    setLoading(true);
    setError(null);
    
    if (!username || !password) {
      setError('Por favor ingresa usuario y contraseña');
      setLoading(false);
      return;
    }

    try {
      const loggedUser = await authService.login(username, password);
      setUser(loggedUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setUser(null);
  };

  return { user, loading, error, handleLogin, handleLogout };
};
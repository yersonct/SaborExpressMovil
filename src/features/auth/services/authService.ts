import { User } from '../types';

const MOCK_USERS: Record<string, User & { email: string }> = {
  'repartidor123': { id: '1', username: 'repartidor123', role: 'repartidor', name: 'Carlos (Moto 1)', email: 'repartidor@saborexpress.com' },
  'cocinero123': { id: '2', username: 'cocinero123', role: 'cocinero', name: 'Chef María', email: 'cocinero@saborexpress.com' },
  'mesero123': { id: '3', username: 'mesero123', role: 'mesero', name: 'Juan Pérez', email: 'yersonstivencuellarrubiano@gmail.com' },
  'cajero123': { id: '4', username: 'cajero123', role: 'cajero', name: 'Ana Caja Principal', email: 'cajero@saborexpress.com' },
  'cliente123': { id: '5', username: 'cliente123', role: 'cliente', name: 'Cliente Frecuente', email: 'cliente@saborexpress.com' },
};

const MOCK_VALID_CODE = '123456';
const VALID_EMAILS = Object.values(MOCK_USERS).map(u => u.email);

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const authService = {
  login: async (username: string, password?: string): Promise<User> => {
    await delay(1000);
    const user = MOCK_USERS[username];
    
    if (user && password === '123456') {
      return user;
    } else {
      throw new Error('Usuario o contraseña incorrectos.');
    }
  },

  requestPasswordReset: async (email: string): Promise<void> => {
    await delay(1000);
    if (!VALID_EMAILS.includes(email.toLowerCase())) {
      throw new Error('Este correo no está registrado en el sistema.');
    }
  },

  verifyPasswordResetCode: async (email: string, code: string): Promise<void> => {
    await delay(1000);
    if (code.trim() !== MOCK_VALID_CODE) {
      throw new Error('Código incorrecto. Por favor, intenta de nuevo.');
    }
  },

  resetPassword: async (email: string, code: string, newPassword: string): Promise<void> => {
    await delay(1000);
    if (newPassword.trim().length < 6) {
      throw new Error('La contraseña debe tener al menos 6 caracteres');
    }
  }
};
import { login } from './login';
import { registerClient } from './registerClient';
import { registerWorker } from './registerWorker';
import { logout } from './logout';
import { getCurrentUser } from './getCurrentUser';

export const authService = {
  login,
  registerClient,
  registerWorker,
  logout,
  getCurrentUser,
};
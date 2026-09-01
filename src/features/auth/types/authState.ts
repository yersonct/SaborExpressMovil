import type { User } from './user';

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
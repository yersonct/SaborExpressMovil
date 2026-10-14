import type { User } from "./user";

export interface AuthResponse {
  token: string;
  refreshToken: string;
  identifier: string;
  roles: string[];
  hasActiveShift: boolean;
  activeShiftRoleName: string | null;
}
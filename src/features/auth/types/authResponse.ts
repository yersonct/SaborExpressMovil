export interface AuthResponse {
  token: string;
  user: {
    identifier: string;
    roleId: number;
  };
}
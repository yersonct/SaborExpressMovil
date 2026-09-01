import type { LoginCredentials } from '../../types';

// Debe coincidir EXACTO con LoginDto (C#)
interface LoginDtoRequest {
  Identifier: string;
  Password: string;
}

export function mapLoginRequest(credentials: LoginCredentials): LoginDtoRequest {
  return {
    Identifier: credentials.identifier,
    Password: credentials.password,
  };
}
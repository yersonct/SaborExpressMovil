import type { ClientRegisterData } from '../../types';

// Debe coincidir EXACTO con RegisterDto (C#)
interface RegisterDtoRequest {
  Name: string;
  LastName: string;
  Email: string;
  Document: string;
  Password: string;
  RoleId: number;
}

export function mapClientRegisterRequest(data: ClientRegisterData): RegisterDtoRequest {
  return {
    Name: data.name,
    LastName: data.lastName,
    Document: data.document,
    Email: data.email,
    Password: data.password,
    RoleId: data.roleId,
  };
}
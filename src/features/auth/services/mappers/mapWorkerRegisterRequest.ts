import type { WorkerRegisterData } from '../../types';

interface RegisterDtoRequest {
  Email?: string;
  Document?: string;
  Password: string;
  RoleId: number;
}

export function mapWorkerRegisterRequest(data: WorkerRegisterData): RegisterDtoRequest {
  return {
    Document: data.document,
    Password: data.password,
    RoleId: data.roleId,
  };
}
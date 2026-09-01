import { RoleId } from './role';

export interface WorkerRegisterData {
  document: string;
  password: string;
  roleId: Exclude<RoleId, RoleId.Cliente>;
}
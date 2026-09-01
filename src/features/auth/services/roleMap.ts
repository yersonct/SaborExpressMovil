import { RoleId } from '../types';

export const ROLE_ROUTES: Record<RoleId, string> = {
  [RoleId.Cliente]: '/client',
  [RoleId.Repartidor]: '/delivery',
  [RoleId.Cocinero]: '/chef',
  [RoleId.Mesero]: '/waiter',
  [RoleId.Cajero]: '/cashier',
};

export const ROLE_LABELS: Record<RoleId, string> = {
  [RoleId.Cliente]: 'CLIENTE',
  [RoleId.Repartidor]: 'REPARTIDOR',
  [RoleId.Cocinero]: 'COCINERO',
  [RoleId.Mesero]: 'MESERO',
  [RoleId.Cajero]: 'CAJERO',
};
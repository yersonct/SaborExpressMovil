export type Role = 'repartidor' | 'cocinero' | 'mesero' | 'cajero';

export interface User {
  id: string;
  username: string;
  role: Role;
  name: string;
}
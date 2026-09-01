import type { User } from '../../types/user';

export function mapUserFromApi(raw: any): User {
  return {
    // Tomamos las propiedades exactas que ahora devuelve la API de C# en minúsculas
    identifier: raw.identifier,
    roleId: raw.roleId,
  };
}
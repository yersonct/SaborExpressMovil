import { ROLE_NAMES, type RoleName } from "../types/role";

export const ROLE_ROUTES: Record<RoleName, string> = {
  [ROLE_NAMES.Cliente]: "/client",
  [ROLE_NAMES.Repartidor]: "/delivery",
  [ROLE_NAMES.Cocinero]: "/chef",
  [ROLE_NAMES.Mesero]: "/waiter",
  [ROLE_NAMES.Cajero]: "/cashier",
  // El Auxiliar de Cocina entra al MISMO tablero que el Cocinero, en modo
  // solo lectura (ChefOrders.tsx ya oculta los botones de avanzar estado).
  [ROLE_NAMES.AuxiliarCocina]: "/chef",
  // Gerente y Administrador todavia no tienen pantalla movil dedicada;
  // ajustar cuando exista (probablemente panel web, no app movil)
};

export const ROLE_LABELS: Record<RoleName, string> = {
  [ROLE_NAMES.Cliente]: "CLIENTE",
  [ROLE_NAMES.Repartidor]: "REPARTIDOR",
  [ROLE_NAMES.Cocinero]: "COCINERO",
  [ROLE_NAMES.Mesero]: "MESERO",
  [ROLE_NAMES.Cajero]: "CAJERO",
  [ROLE_NAMES.AuxiliarCocina]: "AUXILIAR DE COCINA",

};

// Un usuario puede tener varios roles (ej. Cliente + Mesero).
// Prioriza el primer rol OPERATIVO que tenga; si no tiene ninguno, usa Cliente.
const PRIORITY_ORDER: RoleName[] = [

  ROLE_NAMES.Mesero,
  ROLE_NAMES.Cajero,
  ROLE_NAMES.Cocinero,
  ROLE_NAMES.AuxiliarCocina,
  ROLE_NAMES.Repartidor,
  ROLE_NAMES.Cliente,
];

export function resolvePrimaryRole(roles: string[]): RoleName {
  for (const candidate of PRIORITY_ORDER) {
    if (roles.includes(candidate)) return candidate;
  }
  return ROLE_NAMES.Cliente;
}

// Si el rol es operativo (Mesero, Cajero, Cocinero, Repartidor) pero no
// tiene turno activo ahora mismo, lo tratamos como Cliente para efectos
// de a qué panel entra — sigue siendo su rol real, solo cambia a dónde navega.
export function resolveEffectiveRole(
  roles: string[],
  hasActiveShift: boolean,
  activeShiftRoleName?: string | null
): RoleName {
  // Si el backend ya nos dice EXACTAMENTE cuál rol tiene el turno activo,
  // usamos ese directo — sin adivinar por prioridad fija. Esto resuelve
  // el caso de un empleado con más de un rol operativo (ej. Mesero +
  // Repartidor), donde antes siempre ganaba el de mayor prioridad aunque
  // el turno real de hoy fuera otro.
  if (activeShiftRoleName && roles.includes(activeShiftRoleName)) {
    return activeShiftRoleName as RoleName;
  }

  const primary = resolvePrimaryRole(roles);

  if (primary !== ROLE_NAMES.Cliente && !hasActiveShift) {
    return ROLE_NAMES.Cliente;
  }

  return primary;
}
export const ROLE_NAMES = {
  Mesero: "MESERO",
  Cajero: "CAJERO",
  Cocinero: "COCINERO",
  Repartidor: "REPARTIDOR",
  Cliente: "CLIENTE",
  AuxiliarCocina: "AUXILIAR_COCINA",

} as const;

export type RoleName = (typeof ROLE_NAMES)[keyof typeof ROLE_NAMES];

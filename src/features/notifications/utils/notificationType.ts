// El backend serializa el enum NotificationType a veces como número (0,1,2...)
// y a veces como texto, según la config de System.Text.Json. Este helper
// normaliza cualquiera de los dos formatos al nombre en texto, para que el
// resto de la app (sonido, íconos, filtros) siempre compare contra un string.
const NOTIFICATION_TYPE_BY_ORDINAL: Record<number, string> = {
  0: "OrderCreated",
  1: "OrderStatusChanged",
  2: "OrderReady",
  3: "DeliveryAssigned",
  4: "DeliveryInTransit",
  5: "DeliveryCompleted",
  6: "ShiftEndingSoon",
  7: "PaymentConfirmed",
  8: "Manual",
  9: "System",
  10: "ReviewReceived",
  11: "TableAvailable",
};

export function normalizeNotificationType(type: string | number): string {
  if (typeof type === "number") {
    return NOTIFICATION_TYPE_BY_ORDINAL[type] ?? String(type);
  }
  // Si ya es texto pero viene como "2" (string numérico), también lo mapeamos.
  if (/^\d+$/.test(type)) {
    return NOTIFICATION_TYPE_BY_ORDINAL[Number(type)] ?? type;
  }
  return type;
}

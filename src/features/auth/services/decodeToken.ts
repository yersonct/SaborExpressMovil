export interface DecodedToken {
  nameid: string;
  unique_name: string;
  role: string;
  EmployeeId?: string;
  BranchId?: string;
  CustomerId?: string;
  exp: number;
  iat: number;
}

export function decodeToken(token: string): DecodedToken | null {
  try {
    const payload = token.split(".")[1];
    // atob funciona en web; en nativo React Native también lo soporta desde RN 0.7x+ / Hermes moderno
    const decoded = JSON.parse(atob(payload));
    return decoded;
  } catch {
    return null;
  }
}

export function getEmployeeIdFromToken(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded?.EmployeeId) return null;
  return Number(decoded.EmployeeId);
}

export function getBranchIdFromToken(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded?.BranchId) return null;
  return Number(decoded.BranchId);
}

export function getCustomerIdFromToken(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded?.CustomerId) return null;
  return Number(decoded.CustomerId);
}

// El id de Usuario (no el de Empleado) viene en el claim estándar "nameid"
// (ClaimTypes.NameIdentifier). Es el mismo Id que usa el backend para
// agrupar las notificaciones por usuario en el Hub de SignalR.
export function getUserIdFromToken(token: string): number | null {
  const decoded = decodeToken(token);
  if (!decoded?.nameid) return null;
  return Number(decoded.nameid);
}

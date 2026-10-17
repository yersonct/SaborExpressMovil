import { useEffect } from "react";
import { usePathname } from "expo-router";
import { useAuth } from "@/features/auth/context/AuthContext";
import { ROLE_ROUTES, resolveEffectiveRole } from "@/features/auth/services/roleMap";
import { routeStorageScope, storeLastVisitedRoute } from "../services/lastVisitedRoute";

/** Solo rutas seguras y explícitamente permitidas. Nunca modales de pago. */
export function RememberRoute() {
  const pathname = usePathname();
  const { user } = useAuth();
  const base = user
    ? ROLE_ROUTES[resolveEffectiveRole(user.roles, user.hasActiveShift, user.activeShiftRoleName)]
    : null;
  const scope = user ? routeStorageScope(user) : null;
  useEffect(() => {
    if (!base || !scope) return;
    void storeLastVisitedRoute(scope, base, pathname).catch(() => undefined);
  }, [base, scope, pathname]);
  return null;
}

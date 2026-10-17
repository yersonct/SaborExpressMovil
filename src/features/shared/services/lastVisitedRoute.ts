import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";

type SessionIdentity = { token: string; identifier: string };

export function routeStorageScope(user: SessionIdentity): string {
  return String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase());
}

const routesByRole: Record<string, string[]> = {
  "/cashier": ["/cashier", "/cashier/profile", "/cashier/settings"],
  "/waiter": ["/waiter", "/waiter/profile", "/waiter/settings"],
  "/delivery": ["/delivery", "/delivery/profile", "/delivery/settings"],
  "/client": ["/client", "/client/profile", "/client/settings", "/client/addresses"],
  "/chef": ["/chef"],
};

function key(scope: string, base: string) {
  return `saborexpress:last-route:v1:${scope}:${base}`;
}

export function isRestorableRoute(pathname: string, base: string) {
  return routesByRole[base]?.includes(pathname) ?? false;
}

export async function storeLastVisitedRoute(scope: string, base: string, pathname: string) {
  if (!isRestorableRoute(pathname, base)) return;
  await AsyncStorage.setItem(key(scope, base), pathname);
}

export async function readLastVisitedRoute(scope: string, base: string): Promise<string> {
  try {
    const remembered = await AsyncStorage.getItem(key(scope, base));
    return remembered && isRestorableRoute(remembered, base) ? remembered : base;
  } catch {
    return base;
  }
}

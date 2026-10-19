import AsyncStorage from "@react-native-async-storage/async-storage";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { getToken } from "@/features/auth/services/tokenStorage";
export interface SavedPd01Printer { id: string; name: string; }
const key = (token: string | null) => {
  if (!token) return null;
  const id = getUserIdFromToken(token);
  return id ? `saborexpress:pd01:cashier:${id}` : null;
};
export async function loadPd01Printer(token?: string | null): Promise<SavedPd01Printer | null> {
  const storageKey = key(token === undefined ? await getToken() : token);
  if (!storageKey) return null;
  try { const x = await AsyncStorage.getItem(storageKey); return x ? JSON.parse(x) : null; }
  catch { return null; }
}
export async function savePd01Printer(token: string, device: SavedPd01Printer | null) {
  const storageKey = key(token);
  if (!storageKey) throw new Error("Inicia sesión para guardar la impresora.");
  if (device) await AsyncStorage.setItem(storageKey, JSON.stringify(device));
  else await AsyncStorage.removeItem(storageKey);
}

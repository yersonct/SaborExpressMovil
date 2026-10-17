import { useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";

/** Persiste solo selección visual simple por usuario, sin datos de pago ni PII. */
export function useRememberedUiState<T extends string | boolean>(
  scope: string,
  initial: T,
  isAllowed?: (value: unknown) => value is T,
): [T, Dispatch<SetStateAction<T>>] {
  const { user } = useAuth();
  const identity = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";
  const key = `saborexpress:ui:v1:${identity}:${scope}`;
  const [value, setValue] = useState<T>(initial);
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const changedDuringLoad = useRef(false);

  useEffect(() => {
    let active = true;
    changedDuringLoad.current = false;
    setLoadedKey(null);
    setValue(initial);
    void AsyncStorage.getItem(key)
      .then((saved) => {
        if (!active || changedDuringLoad.current || saved == null) return;
        const restored: unknown = JSON.parse(saved);
        const valid = isAllowed
          ? isAllowed(restored)
          : typeof restored === typeof initial;
        if (valid) setValue(restored as T);
      })
      .catch(() => undefined)
      .finally(() => { if (active) setLoadedKey(key); });
    return () => { active = false; };
  }, [key]);

  useEffect(() => {
    if (loadedKey !== key || !user) return;
    void AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => undefined);
  }, [key, loadedKey, user, value]);

  const update: Dispatch<SetStateAction<T>> = (next) => {
    changedDuringLoad.current = true;
    setValue(next);
  };
  return [value, update];
}

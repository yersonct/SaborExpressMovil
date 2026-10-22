import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/features/auth/context/AuthContext";
import { getUserIdFromToken } from "@/features/auth/services/decodeToken";
import { deferEffect } from "@/features/shared/utils/deferEffect";

const CART_STORAGE_PREFIX = "saborexpress_client_cart";

export interface CartItem {
  id: string;
  cartId: string;
  name: string;
  category: string;
  price: number;
  desc: string;
  image: string | null;
}

export function useCart() {
  const { user } = useAuth();
  const userScope = user
    ? String(getUserIdFromToken(user.token) ?? user.identifier.trim().toLowerCase())
    : "anonymous";
  const storageKey = `${CART_STORAGE_PREFIX}:${encodeURIComponent(userScope)}`;
  const [cartState, setCartState] = useState<{
    storageKey: string;
    cart: CartItem[];
    loaded: boolean;
  }>({ storageKey, cart: [], loaded: false });
  const cart = cartState.storageKey === storageKey ? cartState.cart : [];
  const loaded = cartState.storageKey === storageKey && cartState.loaded;

  // Each account gets its own cart on shared devices.
  useEffect(() => deferEffect(() => {
    let active = true;
    setCartState({ storageKey, cart: [], loaded: false });
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(storageKey);
        const restored = raw ? JSON.parse(raw) as CartItem[] : [];
        if (active) setCartState({ storageKey, cart: restored, loaded: true });
      } catch {
        if (active) setCartState({ storageKey, cart: [], loaded: true });
      }
    })();
    return () => { active = false; };
  }), [storageKey]);

  // Save only state belonging to the currently active account.
  useEffect(() => {
    if (cartState.storageKey !== storageKey || !cartState.loaded) return;
    AsyncStorage.setItem(storageKey, JSON.stringify(cartState.cart)).catch(
      () => {},
    );
  }, [cartState, storageKey]);

  const addItem = useCallback((item: Omit<CartItem, "cartId">) => {
    setCartState((current) => ({
      storageKey,
      loaded: true,
      cart: [
        ...(current.storageKey === storageKey ? current.cart : []),
        { ...item, cartId: Math.random().toString() },
      ],
    }));
  }, [storageKey]);

  const removeItem = useCallback((cartId: string) => {
    setCartState((current) => ({
      ...current,
      storageKey,
      cart: (current.storageKey === storageKey ? current.cart : []).filter(
        (item) => item.cartId !== cartId,
      ),
    }));
  }, [storageKey]);

  const clearCart = useCallback(() => {
    setCartState({ storageKey, cart: [], loaded: true });
    AsyncStorage.removeItem(storageKey).catch(() => {});
  }, [storageKey]);

  const setCart = useCallback((next: CartItem[]) => {
    setCartState({ storageKey, cart: next, loaded: true });
  }, [storageKey]);

  return { cart, loaded, addItem, removeItem, clearCart, setCart };
}

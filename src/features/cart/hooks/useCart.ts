import { useCallback, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const CART_STORAGE_KEY = "saborexpress_client_cart";

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Carga el carrito guardado al montar
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(CART_STORAGE_KEY);
        if (raw) setCart(JSON.parse(raw));
      } catch {
        // si falla la lectura, simplemente arranca con carrito vacío
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Guarda automáticamente cada vez que cambia (solo después de la carga inicial)
  useEffect(() => {
    if (!loaded) return;
    AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart)).catch(
      () => {},
    );
  }, [cart, loaded]);

  const addItem = useCallback((item: Omit<CartItem, "cartId">) => {
    setCart((prev) => [...prev, { ...item, cartId: Math.random().toString() }]);
  }, []);

  const removeItem = useCallback((cartId: string) => {
    setCart((prev) => prev.filter((item) => item.cartId !== cartId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
    AsyncStorage.removeItem(CART_STORAGE_KEY).catch(() => {});
  }, []);

  return { cart, loaded, addItem, removeItem, clearCart, setCart };
}

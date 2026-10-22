import { useCallback, useEffect, useState } from "react";
import { productService } from "../services/productService";
import type { Product } from "../types/product.types";
import {
  PRODUCTS_CHANGED,
  REALTIME_CONNECTED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export function useProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    if (!silent) setError(null);
    try {
      const data = await productService.getAll();
      setProducts(data.filter((p) => p.status));
    } catch (err: any) {
      if (!silent) setError(err?.message ?? "No se pudieron cargar los productos");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => deferEffect(() => {
    fetchProducts();
  }), [fetchProducts]);

  useEffect(() => {
    const refresh = () => void fetchProducts(true);
    const unsubscribeProducts = subscribeRealtimeEvent(PRODUCTS_CHANGED, refresh);
    const unsubscribeReconnect = subscribeRealtimeEvent(REALTIME_CONNECTED, refresh);
    return () => {
      unsubscribeProducts();
      unsubscribeReconnect();
    };
  }, [fetchProducts]);

  return { products, loading, error, refetch: fetchProducts };
}

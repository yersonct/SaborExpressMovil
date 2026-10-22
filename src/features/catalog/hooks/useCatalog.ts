import { useEffect, useState } from "react";
import { catalogService } from "../services/catalogService";
import type { Category, Product } from "../types/catalog.types";
import {
  PRODUCTS_CHANGED,
  REALTIME_CONNECTED,
  subscribeRealtimeEvent,
} from "@/features/shared/services/realtimeEvents";
import { deferEffect } from "@/features/shared/utils/deferEffect";

export function useCatalog(branchId?: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshVersion, setRefreshVersion] = useState(0);

  useEffect(() => {
    const refresh = () => setRefreshVersion((version) => version + 1);
    const unsubscribeProducts = subscribeRealtimeEvent(PRODUCTS_CHANGED, refresh);
    const unsubscribeReconnect = subscribeRealtimeEvent(REALTIME_CONNECTED, refresh);
    return () => {
      unsubscribeProducts();
      unsubscribeReconnect();
    };
  }, []);

  useEffect(() => deferEffect(() => {
    // Sin sede resuelta no mostramos nada
    if (!branchId) {
      setCategories([]);
      setProducts([]);
      setError(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cats, prods] = await Promise.all([
          catalogService.getCategories(),
          catalogService.getProducts(branchId),
        ]);
        if (cancelled) return;

        const activeCategories = cats.filter((c) => c.status);
        const activeCategoryIds = new Set(activeCategories.map((c) => c.id));

        setCategories(activeCategories);
        setProducts(
          prods.filter(
            (p) =>
              p.status &&
              activeCategoryIds.has(p.categoryId) &&
              (p.branchId === null || p.branchId === branchId),
          ),
        );
      } catch (err: any) {
        if (!cancelled) setError(err?.message ?? "No se pudo cargar el menú");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }), [branchId, refreshVersion]);

  return { categories, products, loading, error };
}

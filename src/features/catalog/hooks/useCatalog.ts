import { useEffect, useState } from "react";
import { catalogService } from "../services/catalogService";
import type { Category, Product } from "../types/catalog.types";

export function useCatalog(branchId?: number | null) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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
  }, [branchId]);

  return { categories, products, loading, error };
}

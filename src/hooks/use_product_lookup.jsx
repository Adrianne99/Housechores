import { useState, useEffect, useCallback } from "react";
import axios from "axios";

export const useProductLookup = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetches all products for the cashier's branch. `loading` is only true
  // for the first load, so refreshing after a sale doesn't blank the POS.
  const refresh = useCallback(
    () =>
      axios
        .get(`/api/products`)
        .then(({ data }) => {
          if (data.success) setAllProducts(data.products);
        })
        .catch(console.error)
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Find by barcode (exact match)
  const findByBarcode = useCallback(
    (barcode) => {
      if (!barcode) return null;
      return allProducts.find((p) => p.barcode === barcode.trim()) ?? null;
    },
    [allProducts],
  );

  // Search by name/brand/barcode (partial match)
  const search = useCallback(
    (query) => {
      if (!query || !query.trim()) return [];
      const q = query.trim().toLowerCase();
      return allProducts
        .filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.barcode.includes(q),
        )
        .slice(0, 8); // cap suggestions
    },
    [allProducts],
  );

  return { allProducts, findByBarcode, search, loading, refresh };
};

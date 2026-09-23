import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const useProductLookup = () => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch all products for the cashier's branch on mount
  useEffect(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/products`)
      .then(({ data }) => {
        if (data.success) setAllProducts(data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

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

  const refresh = useCallback(() => {
    setLoading(true);
    axios
      .get(`${BACKEND_URL}/api/products`)
      .then(({ data }) => {
        if (data.success) setAllProducts(data.products);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { allProducts, findByBarcode, search, loading, refresh };
};

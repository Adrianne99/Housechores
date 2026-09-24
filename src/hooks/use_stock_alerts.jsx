import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";

// Products in the user's branch that are at/below their reorder level,
// most urgent first, plus a "request restock" action.
export const useStockAlerts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [requested, setRequested] = useState({}); // inventory_id → message

  const refresh = useCallback(
    () =>
      axios
        .get("/api/products")
        .then(({ data }) => {
          setProducts(data.products ?? []);
          setError(null);
        })
        .catch((err) => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const alerts = useMemo(
    () =>
      products
        .filter((p) => p.stock_management.current_stock <= p.stock_management.reorder_level)
        .map((p) => ({
          ...p,
          level: p.stock_management.current_stock <= 0 ? "out" : "low",
        }))
        .sort((a, b) => a.stock_management.current_stock - b.stock_management.current_stock),
    [products],
  );

  const requestRestock = useCallback(async (inventory_id, note) => {
    try {
      const { data } = await axios.post("/api/notifications/restock-request", {
        inventory_id,
        note,
      });
      setRequested((r) => ({ ...r, [inventory_id]: { ok: true, message: data.message } }));
    } catch (err) {
      setRequested((r) => ({
        ...r,
        [inventory_id]: { ok: false, message: err.response?.data?.message || err.message },
      }));
    }
  }, []);

  return { alerts, total: products.length, loading, error, refresh, requestRestock, requested };
};

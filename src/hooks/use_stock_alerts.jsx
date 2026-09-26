import { useMemo, useState } from "react";
import axios from "axios";
import { useProducts } from "./use_product_lookup";
import { error_message } from "../lib/query";

// Products in the user's branch that are at/below their reorder level,
// most urgent first (same cached product list as the POS), plus a
// "request restock" action for cashiers.
export const useStockAlerts = () => {
  const { data: products = [], isPending, error, refetch } = useProducts();
  const [requested, setRequested] = useState({}); // inventory_id → { ok, message }

  const alerts = useMemo(
    () =>
      products
        .filter((p) => p.stock_management.current_stock <= p.stock_management.reorder_level)
        .map((p) => {
          const { current_stock, critical_level = 0 } = p.stock_management;
          return { ...p, level: current_stock <= 0 ? "out" : current_stock <= critical_level ? "critical" : "low" };
        })
        .sort((a, b) => a.stock_management.current_stock - b.stock_management.current_stock),
    [products],
  );

  const requestRestock = async (inventory_id, note) => {
    try {
      const { data } = await axios.post("/api/notifications/restock-request", { inventory_id, note });
      setRequested((r) => ({ ...r, [inventory_id]: { ok: true, message: data.message } }));
    } catch (err) {
      setRequested((r) => ({ ...r, [inventory_id]: { ok: false, message: error_message(err) } }));
    }
  };

  return {
    alerts,
    total: products.length,
    loading: isPending,
    error: error_message(error),
    refresh: refetch,
    requestRestock,
    requested,
  };
};

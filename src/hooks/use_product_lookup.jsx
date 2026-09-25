import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { get, queryClient } from "../lib/query";

// Products for the user's branch (admins: ?branch_id), cached under
// ["products", branch_id]. Shared by the POS, Stock Alerts and dashboards.
export const products_key = (branch_id) => ["products", branch_id ?? "mine"];

export const useProducts = (branch_id, options = {}) =>
  useQuery({
    queryKey: products_key(branch_id),
    queryFn: () => get("/api/products", branch_id ? { branch_id } : undefined),
    select: (data) => data.products ?? [],
    ...options,
  });

// After a sale, lower the cached stock by what was sold — the POS
// updates instantly without re-downloading the whole product list.
export const apply_sale_to_products = (order) => {
  const sold = new Map();
  for (const item of order.items ?? []) {
    if (item.inventory) sold.set(String(item.inventory), (sold.get(String(item.inventory)) ?? 0) + item.quantity);
  }
  if (sold.size === 0) return;
  queryClient.setQueriesData({ queryKey: ["products"] }, (data) =>
    data?.products
      ? {
          ...data,
          products: data.products.map((p) =>
            sold.has(String(p._id))
              ? {
                  ...p,
                  stock_management: {
                    ...p.stock_management,
                    current_stock: Math.max(0, p.stock_management.current_stock - sold.get(String(p._id))),
                  },
                }
              : p,
          ),
        }
      : data,
  );
};

// branch_id: admins pick which branch the POS sells from.
export const useProductLookup = (branch_id, options) => {
  const { data: allProducts = [], isPending: loading, refetch } = useProducts(branch_id, options);

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

  return { allProducts, findByBarcode, search, loading, refresh: refetch };
};

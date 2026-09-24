import { useState, useCallback, useMemo } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, queryClient, error_message } from "../lib/query";

// Local calendar day → the real instants the backend should filter on
// (a bare "2026-09-25" would be read as UTC midnight, 8 hours off).
const day_start = (d) => new Date(`${d}T00:00:00`).toISOString();
const day_end = (d) => new Date(`${d}T23:59:59.999`).toISOString();

export const useOrders = ({ initialFilters = {} } = {}) => {
  // Filters: status, from, to, branch, cashier, limit, skip
  const [filters, setFilters] = useState({
    status: "",
    from: "",
    to: "",
    branch: "",
    cashier: "",
    limit: 25,
    skip: 0,
    ...initialFilters,
  });

  const params = useMemo(() => {
    const p = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v === "" || v === null || v === undefined) return;
      if (k === "from") p.from = day_start(v);
      else if (k === "to") p.to = day_end(v);
      else p[k] = v;
    });
    return p;
  }, [filters]);

  const q = useQuery({
    queryKey: ["orders", "list", params],
    queryFn: () => get("/api/orders", params),
    placeholderData: keepPreviousData, // keep the table while the next page loads
  });

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      skip: key !== "skip" ? 0 : value, // reset to page 1 on filter change
    }));
  }, []);

  const triggerRefresh = useCallback(
    () => queryClient.invalidateQueries({ queryKey: ["orders"] }),
    [],
  );

  return {
    orders: q.data?.orders ?? [],
    total: q.data?.total ?? 0,
    loading: q.isPending,
    error: error_message(q.error),
    filters,
    updateFilter,
    triggerRefresh,
  };
};

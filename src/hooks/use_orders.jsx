import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const useOrders = ({ initialFilters = {} } = {}) => {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refresh, setRefresh] = useState(0);

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

  const updateFilter = useCallback((key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      skip: key !== "skip" ? 0 : value, // reset to page 1 on filter change
    }));
  }, []);

  const triggerRefresh = useCallback(() => setRefresh((r) => r + 1), []);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = {};
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== "" && v !== null && v !== undefined) params[k] = v;
    });

    axios
      .get(`${BACKEND_URL}/api/orders`, { params })
      .then(({ data }) => {
        if (data.success) {
          setOrders(data.orders);
          setTotal(data.total);
        }
      })
      .catch((err) => setError(err.response?.data?.message || err.message))
      .finally(() => setLoading(false));
  }, [filters, refresh]);

  return {
    orders,
    total,
    loading,
    error,
    filters,
    updateFilter,
    triggerRefresh,
  };
};

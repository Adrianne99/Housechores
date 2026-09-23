import { useState, useEffect, useCallback } from "react";
import axios from "axios";

// Fetches the role-scoped dashboard statistics. `branch` is optional and
// only honored for admins (the backend ignores it for scoped roles).
export const useDashboard = (branch) => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.get("/api/dashboard/stats", {
        params: branch ? { branch } : {},
      });
      if (!data.success) throw new Error(data.message || "Failed to load stats.");
      setStats(data.stats);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  }, [branch]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { stats, loading, error, refresh: fetchStats };
};

import { useCallback, useEffect, useState } from "react";
import axios from "axios";

// Role-scoped sales summary for one business day ("YYYY-MM-DD").
// Employees get their own sales, managers their branch.
export const useSalesSummary = (date) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    let stale = false;
    axios
      .get("/api/orders/summary", { params: date ? { date } : {} })
      .then(({ data }) => {
        if (stale) return;
        if (!data.success) throw new Error(data.message);
        setSummary(data.summary);
        setError(null);
      })
      .catch((err) => !stale && setError(err.response?.data?.message || err.message))
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [date]);

  useEffect(() => refresh(), [refresh]);

  return { summary, loading, error, refresh };
};

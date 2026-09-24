import { useCallback, useEffect, useState } from "react";
import axios from "axios";

// The signed-in cashier's open cash drawer (or null) with live figures,
// plus open / cash-in-out / close actions.
export const useDrawer = () => {
  const [session, setSession] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const apply = (data) => {
    setSession(data.session ?? null);
    setSummary(data.summary ?? null);
    setError(null);
  };

  const refresh = useCallback(
    () =>
      axios
        .get("/api/drawer/current")
        .then(({ data }) => apply(data))
        .catch((err) => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  // Each action returns { ok, data?, message? } so forms can show errors.
  const run = async (request) => {
    try {
      const { data } = await request();
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: err.response?.data?.message || err.message };
    }
  };

  const open = async (payload) => {
    const r = await run(() => axios.post("/api/drawer/open", payload));
    if (r.ok) apply(r.data);
    return r;
  };

  const move = async (payload) => {
    const r = await run(() => axios.post("/api/drawer/movement", payload));
    if (r.ok) apply(r.data);
    return r;
  };

  const close = async (payload) => {
    const r = await run(() => axios.post("/api/drawer/close", payload));
    if (r.ok) {
      setSession(null);
      setSummary(null);
    }
    return r;
  };

  return { session, summary, loading, error, refresh, open, move, close };
};

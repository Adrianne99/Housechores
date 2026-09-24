import { useCallback, useEffect, useState } from "react";
import axios from "axios";

// Clock-in status, this week's hours, upcoming shifts and recent logs for
// the signed-in staff member, plus clock in/out actions.
export const useTimeClock = ({ withLogs = false } = {}) => {
  const [status, setStatus] = useState(null);
  const [shifts, setShifts] = useState([]);
  const [today, setToday] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const refresh = useCallback(
    () =>
      Promise.all([
        axios.get("/api/timelog/my-status"),
        axios.get("/api/schedule/mine"),
        withLogs ? axios.get("/api/timelog/my-logs", { params: { limit: 30 } }) : null,
      ])
        .then(([s, sh, l]) => {
          setStatus(s.data.status);
          setShifts(sh.data.shifts ?? []);
          setToday(sh.data.today);
          if (l) setLogs(l.data.logs ?? []);
          setError(null);
        })
        .catch((err) => setError(err.response?.data?.message || err.message))
        .finally(() => setLoading(false)),
    [withLogs],
  );

  useEffect(() => {
    refresh();
  }, [refresh]);

  const toggle = useCallback(async () => {
    setBusy(true);
    try {
      const path = status?.clocked_in ? "clock-out" : "clock-in";
      await axios.post(`/api/timelog/${path}`);
      await refresh();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setBusy(false);
    }
  }, [status?.clocked_in, refresh]);

  const todays_shift = shifts.find((s) => s.date === today) ?? null;

  return { status, shifts, todays_shift, logs, loading, busy, error, toggle, refresh };
};

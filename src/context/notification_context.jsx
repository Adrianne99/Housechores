import { createContext, useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";

// Shared notification state for the signed-in layout: the header bell,
// the dashboard feed and the Notifications page all read from here, and
// only one poller runs.
const POLL_MS = 30000;

const NotificationContext = createContext(null);

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(
    () =>
      axios
        .get("/api/notifications", { params: { limit: 30 } })
        .then(({ data }) => {
          if (!data.success) return;
          setNotifications(data.notifications);
          setUnread(data.unread);
        })
        .catch(() => {})
        .finally(() => setLoading(false)),
    [],
  );

  useEffect(() => {
    refresh();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const on_focus = () => refresh();
    window.addEventListener("focus", on_focus);
    return () => {
      clearInterval(id);
      window.removeEventListener("focus", on_focus);
    };
  }, [refresh]);

  const markRead = useCallback(async (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id && !n.read_at ? { ...n, read_at: new Date() } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    await axios.patch(`/api/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date() })));
    setUnread(0);
    await axios.patch("/api/notifications/read-all").catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider
      value={{ notifications, unread, loading, refresh, markRead, markAllRead }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Returns null outside the signed-in layout (e.g. on public pages).
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext);

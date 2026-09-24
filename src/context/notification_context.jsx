import { createContext, useCallback, useContext } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { get, queryClient } from "../lib/query";

// Shared notification state for the signed-in layout: the header bell,
// the dashboard feed and the Notifications page all read the same cached
// query. TanStack Query does the polling (every 30s while the tab is
// visible, and when you come back to the tab) — no effects needed.
const KEY = ["notifications"];
const NotificationContext = createContext(null);

const patch = (fn) =>
  queryClient.setQueryData(KEY, (d) => (d ? { ...d, ...fn(d) } : d));

export const NotificationProvider = ({ children }) => {
  const q = useQuery({
    queryKey: KEY,
    queryFn: () => get("/api/notifications", { limit: 30 }),
    refetchInterval: 30_000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });

  const markRead = useCallback(async (id) => {
    patch((d) => {
      const target = d.notifications.find((n) => n._id === id);
      if (!target || target.read_at) return {};
      return {
        notifications: d.notifications.map((n) => (n._id === id ? { ...n, read_at: new Date() } : n)),
        unread: Math.max(0, d.unread - 1),
      };
    });
    await axios.patch(`/api/notifications/${id}/read`).catch(() => {});
  }, []);

  const markAllRead = useCallback(async () => {
    patch((d) => ({
      notifications: d.notifications.map((n) => ({ ...n, read_at: n.read_at ?? new Date() })),
      unread: 0,
    }));
    await axios.patch("/api/notifications/read-all").catch(() => {});
  }, []);

  return (
    <NotificationContext.Provider
      value={{
        notifications: q.data?.notifications ?? [],
        unread: q.data?.unread ?? 0,
        loading: q.isPending,
        refresh: q.refetch,
        markRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

// Returns null outside the signed-in layout (e.g. on public pages).
// eslint-disable-next-line react-refresh/only-export-components
export const useNotifications = () => useContext(NotificationContext);

import { useQuery } from "@tanstack/react-query";
import { get, error_message } from "../lib/query";

// Role-scoped dashboard statistics. `branch` is optional and only honored
// for admins (the backend ignores it for scoped roles).
export const useDashboard = (branch) => {
  const q = useQuery({
    queryKey: ["dashboard", branch ?? "all"],
    queryFn: () => get("/api/dashboard/stats", branch ? { branch } : undefined),
    select: (data) => data.stats,
  });
  return { stats: q.data ?? null, loading: q.isPending, error: error_message(q.error), refresh: q.refetch };
};

import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get, error_message } from "../lib/query";

// Role-scoped sales summary for one business day ("YYYY-MM-DD").
// Employees get their own sales, managers their branch.
export const useSalesSummary = (date) => {
  const q = useQuery({
    queryKey: ["orders", "summary", date ?? "today"],
    queryFn: () => get("/api/orders/summary", date ? { date } : undefined),
    select: (data) => data.summary,
    placeholderData: keepPreviousData, // switching dates doesn't blank the page
  });
  return { summary: q.data ?? null, loading: q.isPending, error: error_message(q.error), refresh: q.refetch };
};

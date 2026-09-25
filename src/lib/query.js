import { QueryClient } from "@tanstack/react-query";
import axios from "axios";

// Server data lives in this cache instead of useState + useEffect.
// - Pages you've already visited render instantly from cache.
// - Data refreshes quietly in the background (no loading flash).
// - After a change, we update the cache directly (setQueryData) or mark
//   it stale (invalidateQueries) instead of re-fetching everything.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

// GET helper: returns the response body.
export const get = (url, params) => axios.get(url, { params }).then((r) => r.data);

// Message to show for a failed request.
export const error_message = (err) => err?.response?.data?.message || err?.message || null;

// Everything cached belongs to the signed-in user — drop it on logout.
export const clear_session_cache = () => {
  queryClient.setQueryData(["me"], null);
  queryClient.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
};

// A sale changed after the fact (refund / void): everything that shows
// sales, stock or drawer cash is out of date. Visible screens refresh
// quietly in the background; others refresh when next opened.
export const refresh_after_order_change = () => {
  for (const key of ["orders", "dashboard", "products", "drawer"]) {
    queryClient.invalidateQueries({ queryKey: [key] });
  }
};

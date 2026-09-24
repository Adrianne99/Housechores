import { useQuery } from "@tanstack/react-query";
import { get, queryClient } from "../lib/query";

// Held (parked) carts for the cashier's branch — shared by the POS badge
// and the Held Orders panel.
export const HELD_KEY = ["held-orders"];

export const useHeldOrders = () =>
  useQuery({
    queryKey: HELD_KEY,
    queryFn: () => get("/api/held-orders"),
    select: (data) => data.held_orders ?? [],
  });

export const refresh_held = () => queryClient.invalidateQueries({ queryKey: HELD_KEY });

// Remove one from the cache right away (after delete/resume-and-sell).
export const drop_held = (id) =>
  queryClient.setQueryData(HELD_KEY, (d) =>
    d?.held_orders ? { ...d, held_orders: d.held_orders.filter((h) => h._id !== id) } : d,
  );

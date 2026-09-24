import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { get, queryClient, error_message } from "../lib/query";

// The signed-in cashier's open cash drawer (or null) with live figures,
// cached under ["drawer", "current"].
const KEY = ["drawer", "current"];
const c = (n) => Math.round(Number(n || 0) * 100);

// After a cash sale, add it to the cached drawer figures instead of
// re-fetching (the server has the same numbers).
export const apply_sale_to_drawer = (order) => {
  if (order.payment?.method !== "cash") return;
  queryClient.setQueryData(KEY, (d) =>
    d?.session && d.summary
      ? {
          ...d,
          summary: {
            ...d.summary,
            transactions: d.summary.transactions + 1,
            cash_sales: (c(d.summary.cash_sales) + c(order.total)) / 100,
            expected_cash: (c(d.summary.expected_cash) + c(order.total)) / 100,
          },
        }
      : d,
  );
};

export const useDrawer = () => {
  const q = useQuery({ queryKey: KEY, queryFn: () => get("/api/drawer/current") });

  // Each action returns { ok, data?, message? } so forms can show errors.
  const run = async (request, after) => {
    try {
      const { data } = await request();
      after(data);
      queryClient.invalidateQueries({ queryKey: ["drawer", "list"] });
      return { ok: true, data };
    } catch (err) {
      return { ok: false, message: error_message(err) };
    }
  };
  const put = (data) => queryClient.setQueryData(KEY, { session: data.session, summary: data.summary });

  return {
    session: q.data?.session ?? null,
    summary: q.data?.summary ?? null,
    loading: q.isPending,
    error: error_message(q.error),
    refresh: q.refetch,
    open: (payload) => run(() => axios.post("/api/drawer/open", payload), put),
    move: (payload) => run(() => axios.post("/api/drawer/movement", payload), put),
    close: (payload) =>
      run(
        () => axios.post("/api/drawer/close", payload),
        () => queryClient.setQueryData(KEY, { session: null, summary: null }),
      ),
  };
};

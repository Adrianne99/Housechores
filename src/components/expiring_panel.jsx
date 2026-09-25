import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { CalendarClock } from "lucide-react";
import { Panel, EmptyState, Skeleton } from "./panel";
import { get, queryClient, error_message } from "../lib/query";
import { date_of, peso } from "../utils/format";
import { cn } from "../utils/utils";

// Batches that expire soon (from delivery expiry dates). Managers can
// take expired stock off the shelf; that's logged as "Expired".
export const ExpiringPanel = ({ can_remove }) => {
  const [days, setDays] = useState(30);
  const q = useQuery({ queryKey: ["products", "expiring", days], queryFn: () => get("/api/stock/expiring", { days }) });
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const items = q.data?.items ?? [];
  const value = items.reduce((t, i) => t + i.value, 0);

  const remove = async (i) => {
    if (!window.confirm(`Remove ${i.quantity} ${i.unit ?? ""} of ${i.name} as expired? This lowers stock and is logged.`)) return;
    setBusy(`${i.inventory}-${i.expiry_date}`);
    setMsg(null);
    try {
      const list = await get("/api/products");
      const p = list.products.find((x) => x._id === i.inventory);
      await axios.patch(`/api/products/${i.inventory}/stock`, {
        current_stock: Math.max(0, p.stock_management.current_stock - i.quantity),
        reorder_level: p.stock_management.reorder_level,
        reason: "expired",
        note: `Expired ${i.expiry_date}`,
      });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setMsg({ ok: true, text: `Removed ${i.quantity} ${i.name}.` });
    } catch (err) {
      setMsg({ ok: false, text: error_message(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Panel
      title={`Expiring soon${items.length ? ` · ${items.length} batch(es) · ${peso(value)} at cost` : ""}`}
      action={
        <select value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Expiring within" className="px-2 py-1 text-xs border border-gray-200 rounded-lg bg-white">
          <option value={7}>Next 7 days</option>
          <option value={30}>Next 30 days</option>
          <option value={90}>Next 90 days</option>
        </select>
      }
    >
      {msg && <p className={cn("text-sm rounded-lg px-3 py-2 mb-3", msg.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>{msg.text}</p>}
      {q.isPending ? (
        <Skeleton rows={3} />
      ) : items.length === 0 ? (
        <EmptyState>Nothing expiring. Record expiry dates when receiving deliveries to track them here.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-50">
          {items.map((i) => {
            const expired = i.days_left < 0;
            const key = `${i.inventory}-${i.expiry_date}`;
            return (
              <li key={key} className="py-2.5 flex flex-wrap items-center gap-3 text-sm">
                <span className={cn("p-2 rounded-lg", expired ? "bg-red-50 text-red-600" : i.days_left <= 7 ? "bg-amber-50 text-amber-600" : "bg-gray-50 text-gray-500")}>
                  <CalendarClock size={16} />
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900">{i.name}</p>
                  <p className="text-xs text-gray-400">
                    about {i.quantity} {i.unit} left from this batch · {peso(i.value)}
                    {i.branch?.name ? ` · ${i.branch.name}` : ""}
                  </p>
                </div>
                <span className={cn("text-xs font-semibold", expired ? "text-red-600" : i.days_left <= 7 ? "text-amber-700" : "text-gray-600")}>
                  {expired ? `Expired ${date_of(i.expiry_date, { month: "short", day: "numeric" })}` : i.days_left === 0 ? "Expires today" : `${i.days_left} day(s) left`}
                </span>
                {can_remove && expired && (
                  <button type="button" onClick={() => remove(i)} disabled={busy === key} className="text-xs font-semibold text-red-600 border border-red-200 rounded-lg px-2.5 py-1 hover:bg-red-50 disabled:opacity-50">
                    Remove as expired
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
};

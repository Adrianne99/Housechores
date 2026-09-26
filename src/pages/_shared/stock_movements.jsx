import { useContext, useMemo, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { Search } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { useDateRange } from "../../components/date_range";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { get, error_message } from "../../lib/query";
import { date_of, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const TYPES = {
  sale: "Sale",
  void: "Voided sale",
  refund: "Refund (restocked)",
  delivery: "Delivery",
  adjustment: "Adjustment",
  transfer_out: "Transfer out",
  transfer_in: "Transfer in",
  transfer_cancelled: "Transfer cancelled",
};
const REASONS = { count: "Stock count", damaged: "Damaged", expired: "Expired", lost: "Lost / stolen", returned: "Returned to supplier", other: "Other" };

// Every stock change with its cause: sales, refunds, deliveries, adjustments, transfers.
export default function StockMovements() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [range, range_controls] = useDateRange("7");
  const [branch, setBranch] = useState("");
  const [type, setType] = useState("");
  const [query, setQuery] = useState("");
  const branches = useBranches({ enabled: is_admin });
  const params = { from: range[0], to: range[1], ...(branch && { branch }) };
  const q = useQuery({ queryKey: ["products", "movements", params], queryFn: () => get("/api/stock/movements", params), placeholderData: keepPreviousData });

  const rows = useMemo(() => {
    const s = query.trim().toLowerCase();
    return (q.data?.movements ?? []).filter((m) => (!type || m.type === type) && (!s || m.name?.toLowerCase().includes(s) || m.reference?.toLowerCase().includes(s)));
  }, [q.data, type, query]);

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Stock Movements" subtitle="Every change to your stock and what caused it." />

      <div className="flex flex-wrap items-center gap-2">
        {range_controls}
        {is_admin && (
          <select value={branch} onChange={(e) => setBranch(e.target.value)} aria-label="Branch" className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">All branches</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
      </div>

      {q.error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error_message(q.error)}</p>}

      <Panel title={`Movements (${rows.length})`}>
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <select value={type} onChange={(e) => setType(e.target.value)} aria-label="Type" className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">All types</option>
            {Object.entries(TYPES).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="relative ml-auto w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Product or reference" aria-label="Search movements" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg" />
          </div>
        </div>
        {q.data?.truncated && <p className="text-xs text-amber-700 mb-2">Showing the latest 2,000. Pick a shorter range to see older ones.</p>}
        {q.isPending ? (
          <Skeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState>No stock changes in this range.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">When</th>
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Type</th>
                  <th className="py-2 font-medium text-right">Change</th>
                  <th className="py-2 font-medium pl-4">Reference / reason</th>
                  <th className="py-2 font-medium">By</th>
                  {is_admin && <th className="py-2 font-medium">Branch</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {rows.map((m, n) => (
                  <tr key={n}>
                    <td className="py-2 text-xs text-gray-500 whitespace-nowrap">{date_of(m.at, { month: "short", day: "numeric" })} {time_of(m.at)}</td>
                    <td className="py-2 font-medium text-gray-900">{m.name}</td>
                    <td className="py-2 text-gray-600">{TYPES[m.type] ?? m.type}</td>
                    <td className={cn("py-2 text-right font-semibold tabular-nums", m.quantity < 0 ? "text-red-600" : "text-green-600")}>
                      {m.quantity > 0 ? "+" : "−"}
                      {Math.abs(m.quantity)}
                    </td>
                    <td className="py-2 pl-4 text-xs text-gray-500">
                      {[m.reference, m.type === "adjustment" ? REASONS[m.reason] ?? m.reason : m.type === "delivery" ? null : m.reason, m.note].filter(Boolean).join(" · ")}
                    </td>
                    <td className="py-2 text-xs text-gray-500">{m.by ?? "—"}</td>
                    {is_admin && <td className="py-2 text-xs text-gray-500">{m.branch_name}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

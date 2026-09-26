import { useContext, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { ClipboardList, Coins, PackageCheck, Truck } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { useDateRange } from "../../components/date_range";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { get, error_message } from "../../lib/query";
import { date_of, num, peso } from "../../utils/format";

const STATUS = {
  draft: "Needs approval",
  approved: "Sending",
  sent: "Sent",
  confirmed: "Confirmed",
  declined: "Declined",
  partially_received: "Partly received",
  received: "Received",
  cancelled: "Cancelled",
};
const plain = (n) => Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Supplier spending (from deliveries) and orders still waiting.
export default function PurchasingReport() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [range, range_controls] = useDateRange("30");
  const [branch, setBranch] = useState("");
  const branches = useBranches({ enabled: is_admin });
  const params = { from: range[0], to: range[1], ...(branch && { branch }) };
  const q = useQuery({ queryKey: ["purchase-orders", "report", params], queryFn: () => get("/api/reports/purchasing", params), placeholderData: keepPreviousData });
  const r = q.data;

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Purchasing Report" subtitle="What you spent per supplier and which orders haven't fully arrived." />

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

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <DashboardCard title="Spent on stock" sign="₱" value={plain(r?.total_spent)} loading={q.isPending} icon={<Coins size={20} />} hint="deliveries received" />
        <DashboardCard title="Deliveries" value={num(r?.deliveries)} loading={q.isPending} icon={<Truck size={20} />} hint={`${num(r?.units_received)} unit(s)`} />
        <DashboardCard title="Orders placed" value={num(Object.entries(r?.orders_by_status ?? {}).filter(([s]) => s !== "draft").reduce((t, [, v]) => t + v.count, 0))} loading={q.isPending} icon={<ClipboardList size={20} />} hint="in this range" />
        <DashboardCard title="Waiting to arrive" value={num(r?.open_orders?.length)} loading={q.isPending} icon={<PackageCheck size={20} />} hint={`${num(r?.open_orders?.filter((o) => o.status === "partially_received").length)} partly received`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Panel title="Spending by supplier">
          {q.isPending ? (
            <Skeleton rows={4} />
          ) : !r.by_supplier.length ? (
            <EmptyState>No deliveries in this range.</EmptyState>
          ) : (
            <ul className="space-y-3">
              {r.by_supplier.map((s) => (
                <li key={s.supplier}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{s.supplier}</span>
                    <span className="tabular-nums font-semibold">{peso(s.spent)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 mt-1">
                    <div className="h-full rounded-full bg-indigo-500" style={{ width: `${s.share}%` }} />
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{s.deliveries} deliver{s.deliveries === 1 ? "y" : "ies"} · {num(s.units)} unit(s) · {s.share}%</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Orders in this range">
          {q.isPending ? (
            <Skeleton rows={4} />
          ) : !Object.keys(r.orders_by_status).length ? (
            <EmptyState>No purchase orders in this range.</EmptyState>
          ) : (
            <ul className="divide-y divide-gray-50 text-sm">
              {Object.entries(r.orders_by_status).map(([s, v]) => (
                <li key={s} className="py-2 flex justify-between">
                  <span className="text-gray-600">{STATUS[s] ?? s}</span>
                  <span className="tabular-nums">{v.count} · {peso(v.value)}</span>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <Panel title="Waiting for delivery">
        {q.isPending ? (
          <Skeleton rows={4} />
        ) : !r.open_orders.length ? (
          <EmptyState>Nothing on order right now.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Supplier</th>
                  <th className="py-2 font-medium">Status</th>
                  <th className="py-2 font-medium">Expected</th>
                  <th className="py-2 font-medium text-right">Received</th>
                  <th className="py-2 font-medium text-right">Still due</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {r.open_orders.map((o) => (
                  <tr key={o._id}>
                    <td className="py-2">
                      <p className="font-medium text-gray-900">{o.po_number}</p>
                      <p className="text-xs text-gray-400">{date_of(o.created_at, { month: "short", day: "numeric" })}{is_admin && o.branch ? ` · ${o.branch}` : ""}</p>
                    </td>
                    <td className="py-2 text-gray-600">{o.supplier}</td>
                    <td className="py-2 text-gray-600">{STATUS[o.status] ?? o.status}</td>
                    <td className="py-2 text-gray-600">{o.expected_delivery_date ? date_of(o.expected_delivery_date, { month: "short", day: "numeric" }) : "—"}</td>
                    <td className="py-2 text-right tabular-nums">{o.received} / {o.ordered}</td>
                    <td className="py-2 text-right tabular-nums font-semibold">{peso(o.remaining_value)}</td>
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

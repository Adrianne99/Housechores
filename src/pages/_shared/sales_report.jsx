import { useContext, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import { get as api_get } from "../../lib/query";
import { Printer, Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useSalesSummary } from "../../hooks/use_sales_summary";
import { date_of, num, peso, time_of, today_local } from "../../utils/format";

const PAYMENT_LABELS = { cash: "Cash", card: "Card", gcash: "GCash", credit: "Utang" };
const DISCOUNT_LABELS = {
  senior: "Senior citizen",
  pwd: "PWD",
  percent: "Percent off",
  amount: "Peso off",
  other: "Other",
};

const Row = ({ label, value, strong, muted }) => (
  <div className={`flex justify-between py-1.5 text-sm ${muted ? "text-gray-400" : "text-gray-600"}`}>
    <span>{label}</span>
    <span className={`tabular-nums ${strong ? "font-bold text-gray-900" : ""}`}>{value}</span>
  </div>
);

export default function SalesReport() {
  const { userData } = useContext(AppContext);
  const [date, setDate] = useState(today_local());
  const { summary: s, loading, error } = useSalesSummary(date);
  // Every refund processed on this day (same role scoping as the summary).
  const refunds_q = useQuery({
    queryKey: ["orders", "refunds", date],
    queryFn: () => api_get("/api/orders/refunds", { date }),
    placeholderData: keepPreviousData,
  });
  const refunds = refunds_q.data?.refunds ?? [];
  const is_employee = userData?.role === "employee";
  // Manual stock changes (damage, expiry, counts…) — managers and admins.
  const adj_q = useQuery({
    queryKey: ["products", "adjustments", date],
    queryFn: () => api_get("/api/products/adjustments", { from: date, to: date }),
    placeholderData: keepPreviousData,
    enabled: !!userData && !is_employee,
  });
  const adjustments = adj_q.data?.adjustments ?? [];
  const scope = is_employee
    ? "Your own sales"
    : userData?.role === "branch_manager"
      ? "All sales in your branch"
      : "All branches";

  const max_hour = Math.max(1, ...(s?.hourly ?? []).map((h) => h.total));

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header
        title={is_employee ? "My Sales" : "Sales Report"}
        subtitle={`${scope} · ${date_of(`${date}T12:00:00`, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}`}
      />

      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <label className="text-sm text-gray-600" htmlFor="report-date">
          Date
        </label>
        <input
          id="report-date"
          type="date"
          value={date}
          max={today_local()}
          onChange={(e) => e.target.value && setDate(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
        />
        <button
          type="button"
          onClick={() => setDate(today_local())}
          className="px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white hover:bg-gray-50"
        >
          Today
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="ml-auto flex items-center gap-2 px-3 py-2 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
        >
          <Printer size={16} /> Print {is_employee ? "shift report" : "report"}
        </button>
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">⚠ {error}</p>}

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        <DashboardCard title="Net sales" value={peso(s?.net_after_refunds ?? s?.net)} loading={loading} icon={<Wallet size={20} />} hint={s?.refunds?.total ? `after ${peso(s.refunds.total)} in refunds` : "after discounts and refunds"} />
        <DashboardCard title="Transactions" value={num(s?.transactions)} loading={loading} icon={<Receipt size={20} />} hint={s?.voided?.count ? `${s.voided.count} voided` : "completed"} />
        <DashboardCard title="Items sold" value={num(s?.items_sold)} loading={loading} icon={<ShoppingBag size={20} />} hint="units" />
        <DashboardCard title="Average sale" value={peso(s?.average_sale)} loading={loading} icon={<TrendingUp size={20} />} hint="per transaction" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Panel title="Sales breakdown">
          {loading ? (
            <Skeleton rows={5} className="h-6" />
          ) : (
            <div className="divide-y divide-dashed divide-gray-200">
              <div className="pb-2">
                <Row label="Gross sales" value={peso(s.gross)} />
                <Row label="Discounts" value={`−${peso(s.discounts)}`} />
                <Row label="Net sales" value={peso(s.net)} strong />
              </div>
              <div className="py-2">
                <Row label="VATable sales" value={peso(s.net - s.vat_exempt_sales)} />
                <Row label="VAT (12%, included)" value={peso(s.vat)} />
                <Row label="VAT-exempt sales" value={peso(s.vat_exempt_sales)} />
              </div>
              <div className="pt-2">
                <Row label="Voided" value={`${s.voided.count} · ${peso(s.voided.total)}`} muted={!s.voided.count} />
                <Row label="Refunds" value={`${s.refunds?.count ?? 0} · −${peso(s.refunds?.total)}`} muted={!s.refunds?.count} />
                <Row label="Net after refunds" value={peso(s.net_after_refunds ?? s.net)} strong />
                <Row label="First sale" value={time_of(s.first_sale)} />
                <Row label="Last sale" value={time_of(s.last_sale)} />
              </div>
            </div>
          )}
        </Panel>

        <Panel title="Payment methods">
          {loading ? (
            <Skeleton rows={3} className="h-6" />
          ) : s.by_payment.length === 0 ? (
            <EmptyState>No payments on this day.</EmptyState>
          ) : (
            <div className="space-y-3">
              {s.by_payment.map((p) => (
                <div key={p.method}>
                  <div className="flex justify-between text-sm">
                    <span className="font-medium text-gray-900">{PAYMENT_LABELS[p.method] ?? p.method}</span>
                    <span className="tabular-nums text-gray-900">{peso(p.total)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${s.net ? (p.total / s.net) * 100 : 0}%` }} />
                    </div>
                    <span className="text-xs text-gray-400 w-16 text-right">{p.count} sale{p.count === 1 ? "" : "s"}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel title="Discounts given">
          {loading ? (
            <Skeleton rows={3} className="h-6" />
          ) : s.by_discount.length === 0 ? (
            <EmptyState>No discounts on this day.</EmptyState>
          ) : (
            <div>
              {s.by_discount.map((d) => (
                <Row key={d.type} label={`${DISCOUNT_LABELS[d.type] ?? d.type} (${d.count})`} value={peso(d.amount)} />
              ))}
              <Row label="Total discounts" value={peso(s.discounts)} strong />
            </div>
          )}
        </Panel>
      </div>

      <Panel title="Sales by hour">
        {loading ? (
          <Skeleton rows={1} className="h-32" />
        ) : s.hourly.length === 0 ? (
          <EmptyState>No sales on this day.</EmptyState>
        ) : (
          <div className="flex items-end gap-1.5 h-40 overflow-x-auto">
            {Array.from({ length: 24 }, (_, hour) => {
              const h = s.hourly.find((x) => x.hour === hour);
              return (
                <div key={hour} className="flex-1 min-w-5 flex flex-col items-center justify-end h-full" title={h ? `${peso(h.total)} · ${h.count} sale(s)` : "No sales"}>
                  <div
                    className={`w-full rounded-t ${h ? "bg-indigo-500" : "bg-gray-100"}`}
                    style={{ height: h ? `${Math.max(6, (h.total / max_hour) * 100)}%` : "4px" }}
                  />
                  <span className="text-[10px] text-gray-400 mt-1">{hour % 3 === 0 ? `${hour % 12 || 12}${hour < 12 ? "a" : "p"}` : ""}</span>
                </div>
              );
            })}
          </div>
        )}
      </Panel>
      <Panel title={`Refunds${refunds.length ? ` · ${refunds.length} · −${peso(refunds_q.data.total)}` : ""}`}>
        {refunds_q.isPending ? (
          <Skeleton rows={3} />
        ) : refunds.length === 0 ? (
          <EmptyState>No refunds on this day.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Time</th>
                  <th className="py-2 font-medium">Order</th>
                  <th className="py-2 font-medium">Items returned</th>
                  <th className="py-2 font-medium">Reason</th>
                  <th className="py-2 font-medium">By / approved by</th>
                  <th className="py-2 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {refunds.map((r) => (
                  <tr key={r._id} className="align-top">
                    <td className="py-2.5 text-gray-600 whitespace-nowrap">{time_of(r.at)}</td>
                    <td className="py-2.5">
                      <p className="font-medium text-gray-900">{r.order_number}</p>
                      {!is_employee && r.branch && <p className="text-xs text-gray-400">{r.branch}</p>}
                    </td>
                    <td className="py-2.5 text-gray-700">
                      {r.items.map((i, n) => (
                        <p key={n}>
                          {i.quantity}× {i.name}
                          {!i.restocked && <span className="text-xs text-amber-600"> · not restocked</span>}
                        </p>
                      ))}
                    </td>
                    <td className="py-2.5 text-gray-600">{r.reason}</td>
                    <td className="py-2.5 text-gray-600">
                      {r.by_name}
                      {r.approved_by_name && r.approved_by_name !== r.by_name && (
                        <span className="block text-xs text-gray-400">approved by {r.approved_by_name}</span>
                      )}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">
                      <span className="font-semibold text-orange-600">−{peso(r.amount)}</span>
                      <span className="block text-xs text-gray-400">{PAYMENT_LABELS[r.method] ?? r.method}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
      {!is_employee && (
        <Panel
          title={`Stock adjustments${adjustments.length ? ` · ${adjustments.length}${adj_q.data.lost_value ? ` · −${peso(adj_q.data.lost_value)} lost` : ""}` : ""}`}
        >
          {adj_q.isPending ? (
            <Skeleton rows={3} />
          ) : adjustments.length === 0 ? (
            <EmptyState>No damaged, expired or corrected stock on this day.</EmptyState>
          ) : (
            <>
              <div className="flex flex-wrap gap-2 mb-3">
                {adj_q.data.by_reason.map((r) => (
                  <span key={r.reason} className="px-3 py-1 rounded-full bg-gray-100 text-xs text-gray-700">
                    {r.label}: {r.units > 0 ? "+" : ""}
                    {r.units} unit(s)
                    {r.value < 0 && <span className="text-red-600"> · −{peso(-r.value)}</span>}
                  </span>
                ))}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                      <th className="py-2 font-medium">Time</th>
                      <th className="py-2 font-medium">Product</th>
                      <th className="py-2 font-medium">Reason</th>
                      <th className="py-2 font-medium">By</th>
                      <th className="py-2 font-medium text-right">Change</th>
                      <th className="py-2 font-medium text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {adjustments.map((a) => (
                      <tr key={a._id} className="align-top">
                        <td className="py-2.5 text-gray-600 whitespace-nowrap">{time_of(a.createdAt)}</td>
                        <td className="py-2.5">
                          <p className="font-medium text-gray-900">{a.product_name}</p>
                          {userData?.role === "admin" && a.branch?.name && <p className="text-xs text-gray-400">{a.branch.name}</p>}
                        </td>
                        <td className="py-2.5 text-gray-600">
                          {adj_q.data.reasons[a.reason] ?? a.reason}
                          {a.note && <span className="block text-xs text-gray-400">{a.note}</span>}
                        </td>
                        <td className="py-2.5 text-gray-600">{a.by_name}</td>
                        <td className="py-2.5 text-right tabular-nums whitespace-nowrap">
                          <span className={a.change < 0 ? "text-red-600 font-semibold" : "text-green-700 font-semibold"}>
                            {a.change > 0 ? "+" : ""}
                            {a.change}
                          </span>
                          <span className="block text-xs text-gray-400">
                            {a.before} → {a.after}
                          </span>
                        </td>
                        <td className="py-2.5 text-right tabular-nums text-gray-600">{a.value ? peso(a.value) : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Panel>
      )}
    </div>
  );
}

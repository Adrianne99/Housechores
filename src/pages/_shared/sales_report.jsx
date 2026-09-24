import { useContext, useState } from "react";
import { Printer, Receipt, ShoppingBag, TrendingUp, Wallet } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useSalesSummary } from "../../hooks/use_sales_summary";
import { date_of, num, peso, time_of, today_local } from "../../utils/format";

const PAYMENT_LABELS = { cash: "Cash", card: "Card", gcash: "GCash" };
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
  const is_employee = userData?.role === "employee";
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
        <DashboardCard title="Net sales" value={peso(s?.net)} loading={loading} icon={<Wallet size={20} />} hint="after discounts" />
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
    </div>
  );
}

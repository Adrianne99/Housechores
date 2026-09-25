import {
  AlertTriangle,
  Boxes,
  CreditCard,
  Package,
  Receipt,
  ShoppingBag,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";

import { H6 } from "../../components/texts";
import { ChartCard, DashboardCard } from "../../components/card";
import Header from "../../components/header";
import { useDashboard } from "../../hooks/use_dashboard";

const peso = (n) =>
  Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
const num = (n) => Number(n ?? 0).toLocaleString("en-PH");

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  voided: "bg-red-100 text-red-600",
  refunded: "bg-amber-100 text-amber-700",
  partially_refunded: "bg-amber-100 text-amber-700",
};

const Panel = ({ title, action, children }) => (
  <div className="bg-white w-full p-6 rounded-xl shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <H6 className="text-gray-500 font-medium uppercase tracking-wider">
        {title}
      </H6>
      {action}
    </div>
    {children}
  </div>
);

const EmptyRow = ({ children }) => (
  <p className="text-xs text-gray-400 italic py-6 text-center">{children}</p>
);

const AdminDashboard = () => {
  const { stats, loading, error } = useDashboard();

  const t = stats?.totals ?? {};
  const tr = stats?.trends ?? {};
  const inv = stats?.inventory ?? {};

  const cards = [
    {
      title: "Total Sales",
      sign: "₱",
      value: peso(t.total_sales),
      change: tr.sales_change,
      hint: "vs last month",
      icon: <Wallet size={20} />,
    },
    {
      title: "Invoices / Receipts",
      value: num(t.order_count),
      change: tr.orders_change,
      hint: "vs last month",
      icon: <Receipt size={20} />,
    },
    {
      title: "Products Sold",
      value: num(t.products_sold),
      change: tr.products_change,
      hint: "vs last month",
      icon: <ShoppingBag size={20} />,
    },
    {
      title: "Avg Order Value",
      sign: "₱",
      value: peso(t.avg_order_value),
      hint: "per completed order",
      icon: <TrendingUp size={20} />,
    },
    {
      title: "Inventory Value",
      sign: "₱",
      value: peso(inv.stock_value),
      hint: `${num(inv.total_products)} products`,
      icon: <Package size={20} />,
    },
    {
      title: "Items in Stock",
      value: num(inv.total_units),
      hint: "total units on hand",
      icon: <Boxes size={20} />,
    },
    {
      title: "Low Stock",
      value: num(inv.low_stock),
      hint: `${num(inv.out_of_stock)} out of stock`,
      icon: <AlertTriangle size={20} />,
    },
    {
      title: "Branches",
      value: num(stats?.branches_count),
      hint: "active",
      icon: <Store size={20} />,
    },
  ];

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Dashboard" />

      {error && (
        <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">
          ⚠ {error}
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
        {cards.map((c) => (
          <DashboardCard key={c.title} loading={loading} {...c} />
        ))}
      </div>

      {/* Chart + recent activity */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        <div className="xl:col-span-2">
          <ChartCard series={stats?.sales_series ?? []} loading={loading} />
        </div>

        <Panel title="Recent Activity">
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 bg-gray-100 rounded animate-pulse" />
              ))}
            </div>
          ) : stats?.recent_orders?.length ? (
            <ul className="divide-y divide-gray-50">
              {stats.recent_orders.map((o) => (
                <li
                  key={o._id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">
                      {o.order_number}
                    </p>
                    <p className="text-xs text-gray-400 truncate">
                      {o.branch} · {o.cashier} · {o.item_count} item
                      {o.item_count === 1 ? "" : "s"}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold text-slate-800">
                      ₱{peso(o.total)}
                    </p>
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${
                        STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {o.status.replace("_", " ")}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>No recent orders yet.</EmptyRow>
          )}
        </Panel>
      </div>

      {/* Top products · Sales by branch · Payment methods */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-3">
        {/* Top products */}
        <Panel title="Top Products">
          {loading ? (
            <div className="h-32 bg-gray-50 rounded animate-pulse" />
          ) : stats?.top_products?.length ? (
            <ul className="space-y-3">
              {stats.top_products.map((p, i) => (
                <li key={p.name} className="flex items-center gap-3">
                  <span className="w-6 h-6 shrink-0 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </span>
                  <span className="flex-1 text-sm text-gray-700 truncate">
                    {p.name}
                  </span>
                  <span className="text-xs text-gray-400">{num(p.qty)} sold</span>
                  <span className="text-sm font-semibold text-slate-800 w-20 text-right">
                    ₱{peso(p.revenue)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>No sales recorded yet.</EmptyRow>
          )}
        </Panel>

        {/* Sales by branch */}
        <Panel title="Sales by Branch">
          {loading ? (
            <div className="h-32 bg-gray-50 rounded animate-pulse" />
          ) : stats?.sales_by_branch?.length ? (
            <ul className="space-y-3">
              {(() => {
                const max = Math.max(
                  1,
                  ...stats.sales_by_branch.map((b) => b.sales),
                );
                return stats.sales_by_branch.map((b) => (
                  <li key={b.name ?? "—"}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-700">{b.name ?? "—"}</span>
                      <span className="font-semibold text-slate-800">
                        ₱{peso(b.sales)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                      <div
                        className="h-full bg-indigo-400 rounded-full"
                        style={{ width: `${(b.sales / max) * 100}%` }}
                      />
                    </div>
                  </li>
                ));
              })()}
            </ul>
          ) : (
            <EmptyRow>No branch sales yet.</EmptyRow>
          )}
        </Panel>

        {/* Payment methods */}
        <Panel title="Payment Methods">
          {loading ? (
            <div className="h-32 bg-gray-50 rounded animate-pulse" />
          ) : stats?.payment_breakdown?.length ? (
            <ul className="space-y-3">
              {stats.payment_breakdown.map((p) => (
                <li
                  key={p.method}
                  className="flex items-center justify-between gap-2"
                >
                  <span className="flex items-center gap-2 text-sm text-gray-700 capitalize">
                    <CreditCard size={15} className="text-indigo-400" />
                    {p.method}
                  </span>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-slate-800">
                      ₱{peso(p.total)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {num(p.count)} order{p.count === 1 ? "" : "s"}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyRow>No payments recorded yet.</EmptyRow>
          )}
        </Panel>
      </div>
    </div>
  );
};

export default AdminDashboard;

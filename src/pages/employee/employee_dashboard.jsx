import { useContext, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router";
import axios from "axios";
import {
  BadgeCheck,
  CalendarClock,
  Clock,
  Hash,
  LogIn,
  LogOut,
  Mail,
  Package,
  Receipt,
  ShoppingBag,
  ShoppingCart,
  Store,
  TrendingUp,
  Wallet,
} from "lucide-react";

import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { NotificationItem } from "../../components/notification_bell";
import { AppContext } from "../../context/app_context";
import { useNotifications } from "../../context/notification_context";
import { useTimeClock } from "../../hooks/use_time_clock";
import { useSalesSummary } from "../../hooks/use_sales_summary";
import { useStockAlerts } from "../../hooks/use_stock_alerts";
import {
  ROLE_LABELS,
  clock_label,
  date_of,
  hours_label,
  initials,
  num,
  peso,
  staff_code,
  time_of,
} from "../../utils/format";
import { cn } from "../../utils/utils";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
};

// ─── Profile card ────────────────────────────────────────────
const ProfileCard = ({ user, clock }) => {
  const { status, todays_shift, busy, toggle, error } = clock;
  const on_shift = !!status?.clocked_in;
  const branch_name = typeof user?.branch === "object" ? user.branch?.name : null;

  const rows = [
    { icon: Hash, label: "Staff ID", value: staff_code(user) },
    { icon: Store, label: "Branch", value: branch_name ?? "Not assigned" },
    { icon: Mail, label: "Email", value: user?.email ?? "—" },
    {
      icon: CalendarClock,
      label: "Today's shift",
      value: todays_shift
        ? `${clock_label(todays_shift.start_time)} – ${clock_label(todays_shift.end_time)}`
        : "No shift scheduled",
    },
    {
      icon: BadgeCheck,
      label: "Member since",
      value: date_of(user?.createdAt, { month: "long", year: "numeric" }),
    },
  ];

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="h-20 bg-linear-to-br from-primary via-second-gradient to-third-gradient" />
      <div className="px-5 pb-5 -mt-10">
        <div className="flex items-end justify-between gap-3">
          <div className="size-20 rounded-2xl border-4 border-white bg-linear-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold flex items-center justify-center shadow-md">
            {initials(user?.name)}
          </div>
          <span
            className={cn(
              "mb-1 inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full",
              on_shift ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500",
            )}
          >
            <span
              className={cn("size-2 rounded-full", on_shift ? "bg-green-500 animate-pulse" : "bg-gray-400")}
            />
            {on_shift ? `On shift since ${time_of(status.clock_in)}` : "Off shift"}
          </span>
        </div>

        <div className="mt-3">
          <p className="text-lg font-bold text-gray-900 leading-tight">{user?.name ?? "—"}</p>
          <p className="text-sm font-medium text-indigo-600">{ROLE_LABELS[user?.role] ?? ""}</p>
        </div>

        <dl className="mt-4 space-y-2.5">
          {rows.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-3 text-sm">
              <Icon size={16} className="text-gray-400 shrink-0" />
              <dt className="text-gray-500 w-28 shrink-0">{label}</dt>
              <dd className="text-gray-900 font-medium truncate">{value}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-4 grid grid-cols-2 gap-2 text-center">
          <div className="bg-gray-50 rounded-lg py-2">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">Today</p>
            <p className="text-sm font-bold text-gray-900">{hours_label(status?.hours_today)}</p>
          </div>
          <div className="bg-gray-50 rounded-lg py-2">
            <p className="text-[11px] text-gray-500 uppercase tracking-wide">This week</p>
            <p className="text-sm font-bold text-gray-900">{hours_label(status?.hours_week)}</p>
          </div>
        </div>

        {error && <p className="mt-3 text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={toggle}
            disabled={busy || !status}
            className={cn(
              "flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white transition-colors disabled:opacity-50",
              on_shift ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700",
            )}
          >
            {on_shift ? <LogOut size={16} /> : <LogIn size={16} />}
            {busy ? "Saving..." : on_shift ? "Clock out" : "Clock in"}
          </button>
          <Link
            to="/employee/pos"
            className="flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold border border-indigo-200 text-indigo-700 hover:bg-indigo-50"
          >
            <ShoppingCart size={16} /> Open POS
          </Link>
        </div>
      </div>
    </section>
  );
};

// ─── Today's transactions (own sales) ────────────────────────
const useRecentOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let stale = false;
    axios
      .get("/api/orders", { params: { limit: 6 } })
      .then(({ data }) => !stale && setOrders(data.orders ?? []))
      .catch(() => {})
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, []);
  return { orders, loading };
};

const STATUS_STYLES = {
  completed: "bg-green-100 text-green-700",
  voided: "bg-red-100 text-red-600",
  refunded: "bg-amber-100 text-amber-700",
};

export default function EmployeeDashboard() {
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();
  const clock = useTimeClock();
  const { summary, loading: sum_loading } = useSalesSummary();
  const { orders, loading: orders_loading } = useRecentOrders();
  const notif = useNotifications();
  const stock = useStockAlerts();

  const cards = [
    {
      title: "My sales today",
      sign: "₱",
      value: peso(summary?.net).replace("₱", ""),
      hint: summary?.discounts ? `${peso(summary.discounts)} in discounts` : "net of discounts",
      icon: <Wallet size={20} />,
    },
    {
      title: "Transactions",
      value: num(summary?.transactions),
      hint: summary?.voided?.count ? `${summary.voided.count} voided` : "completed today",
      icon: <Receipt size={20} />,
    },
    {
      title: "Items sold",
      value: num(summary?.items_sold),
      hint: "units today",
      icon: <ShoppingBag size={20} />,
    },
    {
      title: "Average sale",
      sign: "₱",
      value: peso(summary?.average_sale).replace("₱", ""),
      hint: summary?.last_sale ? `last sale ${time_of(summary.last_sale)}` : "no sales yet",
      icon: <TrendingUp size={20} />,
    },
  ];

  const first_name = userData?.name?.split(" ")[0] ?? "";

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header
        title="Dashboard"
        subtitle={`${greeting()}${first_name ? `, ${first_name}` : ""} 👋`}
      />

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <ProfileCard user={userData} clock={clock} />

        <div className="xl:col-span-2 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {cards.map((c) => (
              <DashboardCard key={c.title} loading={sum_loading} {...c} />
            ))}
          </div>

          <Panel
            title="Recent transactions"
            action={
              <Link to="/employee/history" className="text-xs font-medium text-indigo-600 hover:underline">
                View all
              </Link>
            }
          >
            {orders_loading ? (
              <Skeleton rows={4} />
            ) : orders.length === 0 ? (
              <EmptyState>No sales yet. Ring up your first order in the POS.</EmptyState>
            ) : (
              <ul className="divide-y divide-gray-100">
                {orders.map((o) => (
                  <li key={o._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{o.order_number}</p>
                      <p className="text-xs text-gray-400">
                        {date_of(o.createdAt, { month: "short", day: "numeric" })} ·{" "}
                        {time_of(o.createdAt)} · {o.items.length} item{o.items.length === 1 ? "" : "s"} ·{" "}
                        {o.payment?.method?.toUpperCase()}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-bold text-gray-900">{peso(o.total)}</p>
                      <span
                        className={cn(
                          "text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize",
                          STATUS_STYLES[o.status] ?? "bg-gray-100 text-gray-600",
                        )}
                      >
                        {o.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Panel
          title="Notifications"
          action={
            <Link to="/employee/notifications" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          }
        >
          {!notif || notif.loading ? (
            <Skeleton rows={3} />
          ) : notif.notifications.length === 0 ? (
            <EmptyState>You're all caught up.</EmptyState>
          ) : (
            <div className="space-y-1">
              {notif.notifications.slice(0, 5).map((n) => (
                <NotificationItem
                  key={n._id}
                  n={n}
                  compact
                  onOpen={(x) => {
                    notif.markRead(x._id);
                    if (x.link) navigate(x.link);
                  }}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title={`Stock alerts${stock.alerts.length ? ` (${stock.alerts.length})` : ""}`}
          action={
            <Link to="/employee/stock-alerts" className="text-xs font-medium text-indigo-600 hover:underline">
              View all
            </Link>
          }
        >
          {stock.loading ? (
            <Skeleton rows={3} />
          ) : stock.alerts.length === 0 ? (
            <EmptyState>
              {stock.total === 0 ? "No products in your branch yet." : "Everything is well stocked. 👍"}
            </EmptyState>
          ) : (
            <ul className="divide-y divide-gray-100">
              {stock.alerts.slice(0, 5).map((p) => (
                <li key={p._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex items-center gap-3 min-w-0">
                    <span
                      className={cn(
                        "p-2 rounded-lg shrink-0",
                        p.level === "out" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600",
                      )}
                    >
                      <Package size={16} />
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{p.name}</p>
                      <p className="text-xs text-gray-400">
                        {p.level === "out"
                          ? "Out of stock"
                          : `${p.stock_management.current_stock} left · reorder at ${p.stock_management.reorder_level}`}
                      </p>
                    </div>
                  </div>
                  {stock.requested[p._id] ? (
                    <span
                      className={cn(
                        "text-[11px] font-medium shrink-0",
                        stock.requested[p._id].ok ? "text-green-600" : "text-red-500",
                      )}
                    >
                      {stock.requested[p._id].ok ? "Requested ✓" : stock.requested[p._id].message}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => stock.requestRestock(p._id)}
                      className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50 shrink-0"
                    >
                      Request restock
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <Clock size={12} /> Figures cover today ({date_of(new Date())}) and refresh when you open this page.
      </p>
    </div>
  );
}

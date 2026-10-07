import { useMemo, useState } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { get, error_message } from "../../lib/query";
import { useBranches } from "../../hooks/use_branches";
import {
  BadgePercent,
  Boxes,
  CalendarClock,
  Package,
  ReceiptText,
  RotateCcw,
  Store,
  Tag,
  Users,
  Wallet,
  Truck,
  ShoppingCart,
} from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { ROLE_LABELS, date_of, initials, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const CATEGORIES = [
  { key: "", label: "All" },
  { key: "product", label: "Products", icon: Package },
  { key: "stock", label: "Stock", icon: Boxes },
  { key: "price", label: "Prices", icon: Tag },
  { key: "order", label: "Voids", icon: ReceiptText },
  { key: "cart", label: "Removed from cart", icon: ShoppingCart },
  { key: "refund", label: "Refunds", icon: RotateCcw },
  { key: "discount", label: "Discounts", icon: BadgePercent },
  { key: "drawer", label: "Cash drawer", icon: Wallet },
  { key: "purchase", label: "Purchasing", icon: Truck },
  { key: "staff", label: "Staff", icon: Users },
  { key: "schedule", label: "Schedules", icon: CalendarClock },
  { key: "branch", label: "Branches", icon: Store },
];
const CATEGORY_TONE = {
  product: "bg-indigo-50 text-indigo-600",
  stock: "bg-sky-50 text-sky-600",
  price: "bg-amber-50 text-amber-600",
  order: "bg-red-50 text-red-600",
  cart: "bg-rose-50 text-rose-600",
  refund: "bg-orange-50 text-orange-600",
  discount: "bg-green-50 text-green-600",
  drawer: "bg-emerald-50 text-emerald-700",
  purchase: "bg-amber-50 text-amber-700",
  staff: "bg-purple-50 text-purple-600",
  schedule: "bg-teal-50 text-teal-600",
  branch: "bg-gray-100 text-gray-600",
};
const ROLE_TONE = {
  admin: "bg-gray-900 text-white",
  branch_manager: "bg-indigo-100 text-indigo-700",
  employee: "bg-green-100 text-green-700",
};
const FIELD_LABELS = {
  selling_price: "Selling price",
  cost_per_unit: "Cost",
  markup_value: "Markup %",
  current_stock: "Stock",
  stock: "Stock",
  reorder_level: "Reorder level",
  hourly_rate: "Hourly rate",
  expected_cash: "Expected cash",
  counted_cash: "Counted cash",
};
const MONEY_FIELDS = new Set(["selling_price", "cost_per_unit", "hourly_rate", "expected_cash", "counted_cash"]);

const fmt = (field, v) =>
  v === null || v === undefined || v === ""
    ? "—"
    : MONEY_FIELDS.has(field) && typeof v === "number"
      ? peso(v)
      : String(v);

const PAGE = 50;

export default function ActivityLog() {
  const [filters, setFilters] = useState({ branch: "", role: "", category: "", from: "", to: "" });
  const branches = useBranches();

  const params = useMemo(
    () => Object.fromEntries(Object.entries(filters).filter(([, v]) => v)),
    [filters],
  );

  // Pages of 50; "Load older activity" fetches the next page.
  const q = useInfiniteQuery({
    queryKey: ["activity", params],
    queryFn: ({ pageParam }) =>
      get("/api/activity", { ...params, limit: PAGE, ...(pageParam && { before: pageParam }) }),
    initialPageParam: null,
    getNextPageParam: (last) =>
      last.has_more && last.logs.length ? last.logs[last.logs.length - 1].createdAt : undefined,
  });
  const logs = useMemo(() => q.data?.pages.flatMap((p) => p.logs) ?? [], [q.data]);
  const hasMore = !!q.hasNextPage;
  const loading = q.isPending;
  const loadingMore = q.isFetchingNextPage;
  const error = error_message(q.error);
  const loadMore = () => q.fetchNextPage();

  const set = (key, value) => setFilters((f) => ({ ...f, [key]: value }));

  // Group rows by calendar day for the timeline.
  const groups = useMemo(() => {
    const out = [];
    for (const l of logs) {
      const day = date_of(l.createdAt, { weekday: "long", month: "long", day: "numeric", year: "numeric" });
      const g = out[out.length - 1];
      if (g?.day === day) g.items.push(l);
      else out.push({ day, items: [l] });
    }
    return out;
  }, [logs]);

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header
        title="Activity Log"
        subtitle="Every change made by your managers and cashiers — who, what, when, and the before → after values."
      />

      <Panel>
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Branch
            <select value={filters.branch} onChange={(e) => set("branch", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-40">
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b._id} value={b._id}>{b.name}</option>
              ))}
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Done by
            <select value={filters.role} onChange={(e) => set("role", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-40">
              <option value="">Everyone</option>
              <option value="branch_manager">Branch managers</option>
              <option value="employee">Cashiers</option>
              <option value="admin">Admins</option>
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            From
            <input type="date" value={filters.from} onChange={(e) => set("from", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            To
            <input type="date" value={filters.to} onChange={(e) => set("to", e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white" />
          </label>
          {Object.values(filters).some(Boolean) && (
            <button
              type="button"
              onClick={() => setFilters({ branch: "", role: "", category: "", from: "", to: "" })}
              className="text-xs font-medium text-indigo-600 hover:underline pb-2.5"
            >
              Clear filters
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => set("category", c.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full border",
                filters.category === c.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
              )}
            >
              {c.label}
            </button>
          ))}
        </div>
      </Panel>

      {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg">⚠ {error}</p>}

      {loading ? (
        <Panel><Skeleton rows={6} className="h-14" /></Panel>
      ) : logs.length === 0 ? (
        <Panel><EmptyState>No activity matches these filters yet.</EmptyState></Panel>
      ) : (
        <div className="space-y-6">
          {groups.map((g) => (
            <Panel key={g.day} title={g.day}>
              <ol className="relative border-l border-gray-100 ml-4 space-y-4">
                {g.items.map((l) => {
                  const cat = CATEGORIES.find((c) => c.key === l.category);
                  const Icon = cat?.icon ?? Package;
                  return (
                    <li key={l._id} className="ml-6">
                      <span className={cn("absolute -left-4 flex items-center justify-center size-8 rounded-full ring-4 ring-white", CATEGORY_TONE[l.category])}>
                        <Icon size={14} />
                      </span>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="size-6 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center">
                          {initials(l.actor_name)}
                        </span>
                        <span className="text-sm font-semibold text-gray-900">{l.actor_name}</span>
                        <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-full", ROLE_TONE[l.actor_role] ?? "bg-gray-100")}>
                          {ROLE_LABELS[l.actor_role] ?? l.actor_role}
                        </span>
                        {l.branch?.name && (
                          <span className="text-[11px] text-gray-500 flex items-center gap-1">
                            <Store size={11} /> {l.branch.name}
                          </span>
                        )}
                        <span className="text-[11px] text-gray-400 ml-auto">{time_of(l.createdAt)}</span>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{l.summary}</p>
                      {l.changes?.length > 0 && (
                        <div className="mt-2 inline-flex flex-col gap-1 bg-gray-50 rounded-lg px-3 py-2">
                          {l.changes.map((c) => (
                            <div key={c.field} className="text-xs text-gray-600 flex flex-wrap items-center gap-1.5">
                              <span className="font-medium text-gray-500 w-28">{FIELD_LABELS[c.field] ?? c.field.replace("_", " ")}</span>
                              <span className="line-through text-gray-400">{fmt(c.field, c.from)}</span>
                              <span>→</span>
                              <span className="font-semibold text-gray-900">{fmt(c.field, c.to)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ol>
            </Panel>
          ))}
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={loadMore}
                disabled={loadingMore}
                className="px-4 py-2 text-sm font-semibold rounded-lg border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50 disabled:opacity-50"
              >
                {loadingMore ? "Loading..." : "Load older activity"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

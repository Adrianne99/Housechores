import { useMemo, useState } from "react";
import { AlertTriangle, Package, PackageX, RefreshCw, Search } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { useStockAlerts } from "../../hooks/use_stock_alerts";
import { cn } from "../../utils/utils";

const FILTERS = [
  { key: "all", label: "All alerts" },
  { key: "out", label: "Out of stock" },
  { key: "low", label: "Low stock" },
];

export default function StockAlerts() {
  const { alerts, total, loading, error, refresh, requestRestock, requested } = useStockAlerts();
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");

  const out_count = alerts.filter((a) => a.level === "out").length;
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return alerts.filter(
      (a) =>
        (filter === "all" || a.level === filter) &&
        (!q || a.name.toLowerCase().includes(q) || a.barcode.includes(q) || a.brand?.toLowerCase().includes(q)),
    );
  }, [alerts, filter, query]);

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Stock Alerts" subtitle="Items at or below their reorder level in your branch." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DashboardCard title="Out of stock" value={out_count} loading={loading} icon={<PackageX size={20} />} hint="can't be sold" />
        <DashboardCard title="Low stock" value={alerts.length - out_count} loading={loading} icon={<AlertTriangle size={20} />} hint="reorder soon" />
        <DashboardCard title="Products in branch" value={total} loading={loading} icon={<Package size={20} />} hint={total ? `${Math.round(((total - alerts.length) / total) * 100)}% healthy` : ""} />
      </div>

      <Panel
        title="Items needing attention"
        action={
          <button type="button" onClick={refresh} className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1">
            <RefreshCw size={12} /> Refresh
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full border",
                filter === f.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
              )}
            >
              {f.label}
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or barcode"
              aria-label="Search stock alerts"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-lg mb-3">⚠ {error}</p>}

        {loading ? (
          <Skeleton rows={5} />
        ) : shown.length === 0 ? (
          <EmptyState>
            {alerts.length === 0 ? "Everything is well stocked. 👍" : "No items match your filter."}
          </EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Product</th>
                  <th className="py-2 font-medium">Barcode</th>
                  <th className="py-2 font-medium">In stock</th>
                  <th className="py-2 font-medium">Reorder at</th>
                  <th className="py-2 font-medium">Supplier</th>
                  <th className="py-2 font-medium text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {shown.map((p) => {
                  const r = requested[p._id];
                  return (
                    <tr key={p._id}>
                      <td className="py-2.5">
                        <p className="font-semibold text-gray-900">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.brand} · {p.category}</p>
                      </td>
                      <td className="py-2.5 font-mono text-xs text-gray-600">{p.barcode}</td>
                      <td className="py-2.5">
                        <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full", p.level === "out" ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-700")}>
                          {p.stock_management.current_stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 text-gray-600">{p.stock_management.reorder_level}</td>
                      <td className="py-2.5 text-gray-600">{p.stock_management.supplier || "—"}</td>
                      <td className="py-2.5 text-right">
                        {r ? (
                          <span className={cn("text-xs font-medium", r.ok ? "text-green-600" : "text-red-500")}>
                            {r.ok ? "Manager notified ✓" : r.message}
                          </span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => requestRestock(p._id)}
                            className="text-xs font-semibold text-indigo-600 border border-indigo-200 rounded-lg px-2.5 py-1 hover:bg-indigo-50"
                          >
                            Request restock
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}

import { useContext, useMemo, useRef, useState } from "react";
import { useLocation } from "react-router";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { get as api_get, queryClient, error_message } from "../../lib/query";
import { useBranches } from "../../hooks/use_branches";
import { useProducts } from "../../hooks/use_product_lookup";
import { ChevronDown, ChevronRight, PackagePlus, Search, Trash2, Truck } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { date_of, peso, time_of } from "../../utils/format";

const c = (n) => Math.round(Number(n || 0) * 100);

const line_from = (p) => ({
  inventory_id: p._id,
  name: p.name,
  unit: p.unit,
  current: p.stock_management.current_stock,
  quantity: 1,
  unit_cost: p.pricing.cost_per_unit,
});

export default function Receiving() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  // "Receive stock" on Stock Alerts passes the product in the link state,
  // so the first line is ready immediately (no effect waiting on data).
  const { state: nav } = useLocation();
  const preset = nav?.product ?? null;

  const branches = useBranches({ enabled: is_admin });
  const [branchChoice, setBranch] = useState(preset?.branch?._id ?? "");
  const branch = branchChoice || branches[0]?._id || "";
  const { data: products = [], isPending: loadingProducts } = useProducts(
    is_admin ? branch : undefined,
    { enabled: !is_admin || !!branch },
  );

  const [supplier, setSupplier] = useState(preset?.stock_management?.supplier ?? "");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [updateCost, setUpdateCost] = useState(true);
  const [lines, setLines] = useState(() => (preset ? [line_from(preset)] : [])); // { inventory_id, name, unit, current, quantity, unit_cost }
  const [query, setQuery] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(null);

  const history_q = useQuery({
    queryKey: ["deliveries"],
    queryFn: () => api_get("/api/deliveries", { limit: 30 }),
  });
  const history = history_q.data?.deliveries ?? [];
  const historyLoading = history_q.isPending;
  const [expanded, setExpanded] = useState(null);
  const searchRef = useRef(null);

  const add = (p) => {
    setLines((ls) =>
      ls.some((l) => l.inventory_id === p._id)
        ? ls.map((l) => (l.inventory_id === p._id ? { ...l, quantity: Number(l.quantity || 0) + 1 } : l))
        : [...ls, line_from(p)],
    );
    if (!supplier && p.stock_management.supplier) setSupplier(p.stock_management.supplier);
    setQuery("");
    setSaved(null);
    searchRef.current?.focus();
  };

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q) || p.brand?.toLowerCase().includes(q))
      .slice(0, 8);
  }, [query, products]);

  const suppliers = useMemo(
    () => [...new Set(products.map((p) => p.stock_management.supplier).filter(Boolean))].sort(),
    [products],
  );

  const set_line = (id, key, value) =>
    setLines((ls) => ls.map((l) => (l.inventory_id === id ? { ...l, [key]: value } : l)));

  const total_units = lines.reduce((t, l) => t + (Math.floor(Number(l.quantity)) || 0), 0);
  const total_cost = lines.reduce((t, l) => t + c(l.unit_cost) * (Math.floor(Number(l.quantity)) || 0), 0) / 100;
  const valid =
    supplier.trim() &&
    lines.length > 0 &&
    lines.every((l) => Number.isInteger(Number(l.quantity)) && Number(l.quantity) > 0 && Number(l.unit_cost) >= 0);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/deliveries", {
        branch: is_admin ? branch : undefined,
        supplier,
        reference,
        notes,
        update_cost: updateCost,
        items: lines.map((l) => ({
          inventory_id: l.inventory_id,
          quantity: Number(l.quantity),
          unit_cost: Number(l.unit_cost),
        })),
      });
      setSaved(data.delivery);
      setLines([]);
      setReference("");
      setNotes("");
      queryClient.invalidateQueries({ queryKey: ["deliveries"] });
      // Stock changed: refresh cached product lists (POS, inventory, picker).
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setError(error_message(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Receiving" subtitle="Record supplier deliveries. Stock goes up and costs stay accurate." />

      {saved && (
        <p className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-xl px-4 py-3">
          ✓ Received {saved.total_units} unit(s) of {saved.items.length} product(s) from {saved.supplier} — {peso(saved.total_cost)}.
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Panel title="Delivery details">
          <div className="space-y-3">
            {is_admin && (
              <label className="text-xs text-gray-500 flex flex-col gap-1">
                Branch
                <select
                  value={branch}
                  onChange={(e) => {
                    setBranch(e.target.value);
                    setLines([]);
                  }}
                  className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
                >
                  {branches.map((b) => (
                    <option key={b._id} value={b._id}>{b.name}</option>
                  ))}
                </select>
              </label>
            )}
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Supplier *
              <input list="suppliers" value={supplier} onChange={(e) => setSupplier(e.target.value)} placeholder="e.g. Puregold Price Club" className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
              <datalist id="suppliers">
                {suppliers.map((s) => <option key={s} value={s} />)}
              </datalist>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Delivery receipt / invoice no.
              <input value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. DR-10233" className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Notes
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="Optional" className="px-3 py-2 text-sm border border-gray-200 rounded-lg" />
            </label>
            <label className="flex items-start gap-2 text-sm text-gray-600">
              <input type="checkbox" checked={updateCost} onChange={(e) => setUpdateCost(e.target.checked)} className="mt-1" />
              <span>
                Update cost prices from this delivery
                <span className="block text-xs text-gray-400">Selling prices stay the same; markup is recalculated.</span>
              </span>
            </label>
          </div>
        </Panel>

        <Panel title="Items received" className="xl:col-span-2">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={searchRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && matches[0]) {
                  e.preventDefault();
                  add(matches[0]);
                }
              }}
              placeholder={loadingProducts ? "Loading products..." : "Scan barcode or search a product to add"}
              aria-label="Add product"
              className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg"
            />
            {matches.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-72 overflow-y-auto">
                {matches.map((p) => (
                  <li key={p._id}>
                    <button type="button" onClick={() => add(p)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between gap-3 text-sm">
                      <span>
                        <span className="font-medium text-gray-900">{p.name}</span>
                        <span className="block text-xs text-gray-400">{p.brand} · {p.barcode}</span>
                      </span>
                      <span className="text-xs text-gray-500 shrink-0">{p.stock_management.current_stock} in stock</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {lines.length === 0 ? (
            <EmptyState>Search or scan products above to add them to this delivery.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[620px] text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                    <th className="py-2 font-medium">Product</th>
                    <th className="py-2 font-medium">Stock</th>
                    <th className="py-2 font-medium w-24">Qty</th>
                    <th className="py-2 font-medium w-28">Unit cost</th>
                    <th className="py-2 font-medium text-right">Line total</th>
                    <th className="py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {lines.map((l) => {
                    const q = Math.floor(Number(l.quantity)) || 0;
                    return (
                      <tr key={l.inventory_id}>
                        <td className="py-2 font-medium text-gray-900">{l.name}</td>
                        <td className="py-2 text-xs text-gray-500 whitespace-nowrap">
                          {l.current} → <span className="font-semibold text-green-600">{l.current + q}</span> {l.unit}
                        </td>
                        <td className="py-2">
                          <input type="number" min={1} step={1} inputMode="numeric" aria-label={`Quantity of ${l.name}`} value={l.quantity} onChange={(e) => set_line(l.inventory_id, "quantity", e.target.value)} className="w-20 px-2 py-1.5 border border-gray-200 rounded-md" />
                        </td>
                        <td className="py-2">
                          <input type="number" min={0} step="0.01" inputMode="decimal" aria-label={`Unit cost of ${l.name}`} value={l.unit_cost} onChange={(e) => set_line(l.inventory_id, "unit_cost", e.target.value)} className="w-24 px-2 py-1.5 border border-gray-200 rounded-md" />
                        </td>
                        <td className="py-2 text-right tabular-nums">{peso((c(l.unit_cost) * q) / 100)}</td>
                        <td className="py-2 text-right">
                          <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.inventory_id !== l.inventory_id))} aria-label={`Remove ${l.name}`} className="p-1.5 text-gray-400 hover:text-red-500">
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">⚠ {error}</p>}

          <div className="mt-4 flex flex-wrap items-center justify-end gap-4 border-t border-gray-100 pt-4">
            <span className="text-sm text-gray-500">
              {total_units} unit(s) · <span className="font-bold text-gray-900">{peso(total_cost)}</span>
            </span>
            <button
              type="button"
              onClick={submit}
              disabled={!valid || saving}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold disabled:opacity-50"
            >
              <PackagePlus size={16} /> {saving ? "Saving..." : "Receive delivery"}
            </button>
          </div>
        </Panel>
      </div>

      <Panel title="Recent deliveries">
        {historyLoading ? (
          <Skeleton rows={4} />
        ) : history.length === 0 ? (
          <EmptyState>No deliveries recorded yet.</EmptyState>
        ) : (
          <ul className="divide-y divide-gray-100">
            {history.map((d) => (
              <li key={d._id} className="py-2">
                <button type="button" onClick={() => setExpanded(expanded === d._id ? null : d._id)} className="w-full flex items-center gap-3 text-left text-sm">
                  {expanded === d._id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                  <Truck size={16} className="text-indigo-500 shrink-0" />
                  <span className="flex-1 min-w-0">
                    <span className="font-semibold text-gray-900">{d.supplier}</span>
                    {d.reference && <span className="text-gray-400"> · {d.reference}</span>}
                    <span className="block text-xs text-gray-400">
                      {date_of(d.received_at, { month: "short", day: "numeric" })} {time_of(d.received_at)} · by {d.received_by_name}
                      {is_admin && d.branch?.name ? ` · ${d.branch.name}` : ""}
                    </span>
                  </span>
                  <span className="text-right shrink-0">
                    <span className="font-bold text-gray-900 tabular-nums">{peso(d.total_cost)}</span>
                    <span className="block text-xs text-gray-400">{d.total_units} unit(s)</span>
                  </span>
                </button>
                {expanded === d._id && (
                  <div className="mt-2 ml-11 bg-gray-50 rounded-lg p-3 text-xs space-y-1">
                    {d.items.map((i) => (
                      <div key={i.inventory} className="flex justify-between gap-3">
                        <span className="text-gray-700">{i.quantity} × {i.name} @ {peso(i.unit_cost)}</span>
                        <span className="text-gray-500">stock {i.prev_stock} → {i.new_stock}</span>
                      </div>
                    ))}
                    {d.notes && <p className="text-gray-500 pt-1">Note: {d.notes}</p>}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </div>
  );
}

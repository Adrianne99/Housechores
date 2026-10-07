import { useContext, useMemo, useRef, useState } from "react";
import axios from "axios";
import { CheckCircle2, ClipboardCheck, Search } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { useProducts } from "../../hooks/use_product_lookup";
import { queryClient, error_message } from "../../lib/query";
import { is_qty, peso, round_qty } from "../../utils/format";
import { cn } from "../../utils/utils";

export default function StockCount() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const branches = useBranches({ enabled: is_admin });
  const [branchChoice, setBranch] = useState("");
  const branch = is_admin ? branchChoice || branches[0]?._id || "" : undefined;
  const { data: products = [], isPending } = useProducts(branch, { enabled: !is_admin || !!branch });
  const [category, setCategory] = useState("");
  const [query, setQuery] = useState("");
  const [hideDone, setHideDone] = useState(false);
  // { [inventory_id]: { counted, expected } } — expected is the system
  // count when that product was counted (sales after that are kept).
  const [counts, setCounts] = useState({});
  const [note, setNote] = useState("");
  const [review, setReview] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);
  const inputs = useRef(new Map());

  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);
  const rows = useMemo(() => {
    const s = query.trim().toLowerCase();
    return products
      .filter((p) => !category || p.category === category)
      .filter((p) => !s || p.name.toLowerCase().includes(s) || p.barcode.includes(s))
      .filter((p) => !hideDone || counts[p._id] === undefined)
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [products, category, query, hideDone, counts]);
  const in_scope = products.filter((p) => !category || p.category === category);
  const done = in_scope.filter((p) => counts[p._id] !== undefined).length;

  const set_count = (p, value) =>
    setCounts((c) => {
      if (value === "") {
        const next = { ...c };
        delete next[p._id];
        return next;
      }
      return { ...c, [p._id]: { counted: value, expected: c[p._id]?.expected ?? p.stock_management.current_stock } };
    });

  const by_id = new Map(products.map((p) => [p._id, p]));
  // Weighed products are counted in kilos (decimals allowed).
  const entries = Object.entries(counts).filter(([id, v]) => is_qty(v.counted, !!by_id.get(id)?.sold_by_weight, true));
  const diffs = entries
    .map(([id, v]) => ({ p: by_id.get(id), diff: round_qty(Number(v.counted) - v.expected), ...v }))
    .filter((d) => d.p && d.diff !== 0);
  const diff_value = diffs.reduce((t, d) => t + Math.round(d.p.pricing.cost_per_unit * 100) * d.diff, 0) / 100;

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await axios.post("/api/stock/count", {
        branch: is_admin ? branch : undefined,
        note: note.trim(),
        items: entries.map(([inventory_id, v]) => ({ inventory_id, expected: v.expected, counted: Number(v.counted) })),
      });
      setResult(data);
      setCounts({});
      setReview(false);
      setNote("");
      queryClient.invalidateQueries({ queryKey: ["products"] });
    } catch (err) {
      setError(error_message(err));
    } finally {
      setBusy(false);
    }
  };

  // Scan a barcode (or type a name) + Enter jumps to that product's box.
  const jump = () => {
    const s = query.trim().toLowerCase();
    const hit = products.find((p) => p.barcode === query.trim()) ?? rows[0];
    if (!hit) return;
    if (products.some((p) => p.barcode === query.trim())) setQuery("");
    setTimeout(() => inputs.current.get(hit._id)?.focus(), 0);
    return s;
  };

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Stock Count" subtitle="Count what's on the shelf. Differences are saved as stock adjustments with the reason “Stock count”." />

      {result && (
        <p className="text-sm text-green-800 bg-green-50 border border-green-100 rounded-xl px-4 py-3 flex items-center gap-2">
          <CheckCircle2 size={16} /> Saved: {result.counted} product(s) counted, {result.changed} corrected
          {result.changed > 0 && ` (${result.units > 0 ? "+" : ""}${result.units} units, ${result.value < 0 ? "−" : ""}${peso(Math.abs(result.value))})`}. See them under Sales Report → Stock adjustments.
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {is_admin && (
          <select
            value={branch}
            onChange={(e) => {
              if (entries.length && !window.confirm("Switching branch discards the counts you've entered. Continue?")) return;
              setCounts({});
              setBranch(e.target.value);
            }}
            aria-label="Branch"
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white"
          >
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        )}
        <button type="button" onClick={() => setCategory("")} className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border", !category ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200")}>
          All
        </button>
        {categories.map((cat) => (
          <button key={cat} type="button" onClick={() => setCategory(cat)} className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border", category === cat ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200")}>
            {cat}
          </button>
        ))}
      </div>

      <Panel
        title={`${done} of ${in_scope.length} counted${category ? ` · ${category}` : ""}`}
        action={
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} /> Hide counted
          </label>
        }
      >
        <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden mb-4">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${in_scope.length ? (done / in_scope.length) * 100 : 0}%` }} />
        </div>
        <div className="relative mb-3">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), jump())}
            placeholder="Scan barcode or search, then Enter"
            aria-label="Find product"
            className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg"
          />
        </div>
        {isPending ? (
          <Skeleton rows={6} />
        ) : rows.length === 0 ? (
          <EmptyState>{hideDone && done ? "Everything here is counted." : "No products match."}</EmptyState>
        ) : (
          <ul className="divide-y divide-gray-50">
            {rows.map((p) => {
              const c = counts[p._id];
              const diff = c ? Number(c.counted) - c.expected : 0;
              return (
                <li key={p._id} className="py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-400">
                      {p.barcode} · system: {c ? c.expected : p.stock_management.current_stock} {p.unit}
                    </p>
                  </div>
                  {c && diff !== 0 && Number.isFinite(diff) && (
                    <span className={cn("text-xs font-semibold tabular-nums", diff < 0 ? "text-red-600" : "text-green-700")}>
                      {diff > 0 ? "+" : ""}
                      {diff}
                    </span>
                  )}
                  {c && diff === 0 && <CheckCircle2 size={16} className="text-green-500" aria-label="Matches" />}
                  <input
                    ref={(el) => (el ? inputs.current.set(p._id, el) : inputs.current.delete(p._id))}
                    type="number"
                    min={0}
                    step={p.sold_by_weight ? 0.001 : 1}
                    inputMode={p.sold_by_weight ? "decimal" : "numeric"}
                    value={c?.counted ?? ""}
                    onChange={(e) => set_count(p, e.target.value)}
                    placeholder="Count"
                    aria-label={`Counted ${p.name}`}
                    className={cn("w-20 px-2 py-2 text-sm text-right border rounded-lg tabular-nums", c ? "border-indigo-300 bg-indigo-50/40" : "border-gray-200")}
                  />
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      {entries.length > 0 && (
        <div className="sticky bottom-3 z-10">
          <div className="bg-white border border-gray-200 shadow-lg rounded-2xl px-5 py-4 space-y-3">
            {review ? (
              <>
                <p className="font-semibold text-gray-900">
                  {diffs.length === 0 ? "Everything you counted matches the system." : `${diffs.length} difference(s) · ${diff_value > 0 ? "+" : diff_value < 0 ? "−" : ""}${peso(Math.abs(diff_value))} at cost`}
                </p>
                {diffs.length > 0 && (
                  <ul className="max-h-40 overflow-y-auto text-sm divide-y divide-gray-50">
                    {diffs.map((d) => (
                      <li key={d.p._id} className="py-1 flex justify-between gap-2">
                        <span className="truncate">{d.p.name}</span>
                        <span className={cn("tabular-nums shrink-0", d.diff < 0 ? "text-red-600" : "text-green-700")}>
                          {d.expected} → {d.counted} ({d.diff > 0 ? "+" : ""}{d.diff})
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
                <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (optional), e.g. Aisle 3, end of day" aria-label="Count note" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
                {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
                <div className="flex justify-end gap-2">
                  <button type="button" onClick={() => setReview(false)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Keep counting</button>
                  <button type="button" onClick={submit} disabled={busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
                    <ClipboardCheck size={16} /> {busy ? "Saving..." : "Save count"}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-wrap items-center gap-3">
                <p className="text-sm text-gray-600">
                  {entries.length} counted · <b className={diffs.length ? "text-amber-700" : "text-green-700"}>{diffs.length} difference(s)</b>
                </p>
                <button type="button" onClick={() => setReview(true)} className="ml-auto px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold">
                  Review & save
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

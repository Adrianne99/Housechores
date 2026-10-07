import { useState } from "react";
import { createPortal } from "react-dom";
import { Package, Plus, Scale, Settings2, Trash2, X } from "lucide-react";
import axios from "axios";
import { Button } from "./buttons";
import { peso } from "../utils/format";
import { queryClient } from "../lib/query";

const input =
  "w-full px-2.5 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 placeholder:text-gray-300";
const label = "text-[11px] font-semibold text-gray-500 uppercase tracking-wide";

const blank_pack = () => ({ _id: undefined, name: "", quantity: "", selling_price: "", barcode: "" });
const same_packs = (a, b) =>
  JSON.stringify(a.map((p) => [p.name, +p.quantity, +p.selling_price, p.barcode ?? ""])) ===
  JSON.stringify(b.map((p) => [p.name, +p.quantity, +p.selling_price, p.barcode ?? ""]));

// Pack sizes (a pack of 20 sticks, a tray of 30 eggs) and "sold by
// weight" for one product. Mounted only while open.
const SellingDialog = ({ product, onUpdate, onClose }) => {
  const unit = product.unit || "pc";
  const [byWeight, setByWeight] = useState(!!product.sold_by_weight);
  const [packs, setPacks] = useState(() =>
    (product.packs ?? []).map((p) => ({ ...p, quantity: String(p.quantity), selling_price: String(p.selling_price) })),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const piece_price = product.pricing?.selling_price ?? 0;

  const set = (n, k) => (e) => setPacks((list) => list.map((p, i) => (i === n ? { ...p, [k]: e.target.value } : p)));

  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      const clean = packs
        .filter((p) => p.name.trim() || p.quantity || p.selling_price)
        .map((p) => ({
          _id: p._id,
          name: p.name.trim(),
          quantity: Number(p.quantity),
          selling_price: Number(p.selling_price),
          barcode: p.barcode?.trim() ?? "",
        }));
      let saved_packs = product.packs ?? [];
      // Packs go first when switching weight on (they must be gone), last
      // when switching it off.
      const put_packs = async (list) => {
        const { data } = await axios.put(`/api/products/${product._id}/packs`, { packs: list });
        saved_packs = data.packs;
      };
      const set_weight = () => axios.patch(`/api/products/${product._id}/sold-by-weight`, { sold_by_weight: byWeight });
      const packs_changed = !same_packs(byWeight ? [] : clean, product.packs ?? []);

      if (byWeight !== !!product.sold_by_weight) {
        if (byWeight) {
          if (packs_changed) await put_packs([]);
          await set_weight();
        } else {
          await set_weight();
          if (packs_changed) await put_packs(clean);
        }
      } else if (packs_changed) {
        await put_packs(byWeight ? [] : clean);
      }
      // Sold-by-weight is shared: every branch's copy of the product changes.
      if (byWeight !== !!product.sold_by_weight) {
        queryClient.setQueriesData({ queryKey: ["products"] }, (d) =>
          d?.products
            ? { ...d, products: d.products.map((r) => (r.product_id === product.product_id ? { ...r, sold_by_weight: byWeight } : r)) }
            : d,
        );
      }
      onUpdate({ sold_by_weight: byWeight, packs: saved_packs });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setBusy(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Selling options"
        onKeyDown={(e) => e.key === "Escape" && !busy && onClose()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xl mx-4 overflow-y-auto max-h-[92vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Selling options</p>
            <p className="text-xs text-gray-400 truncate">
              {product.name} · {peso(piece_price)} per {unit}
            </p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-5">
          <label className="flex items-start gap-3 rounded-xl border border-gray-200 p-3 cursor-pointer">
            <input type="checkbox" checked={byWeight} onChange={(e) => setByWeight(e.target.checked)} className="mt-1" />
            <span className="text-sm text-gray-700">
              <span className="font-semibold flex items-center gap-1.5">
                <Scale size={14} className="text-indigo-500" /> Sold by weight
                {product.sold_by_weight && <span className="font-normal text-gray-400">(per {unit})</span>}
              </span>
              <span className="block text-xs text-gray-400 mt-0.5">
                For rice, sugar, meat… The cashier types the weight or a peso amount (&quot;₱20 worth&quot;), and stock is kept to
                the gram. Set the unit to kg and the price per kg. Applies to every branch.
              </span>
            </span>
          </label>

          {byWeight ? (
            packs.length > 0 && (
              <p className="text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">Pack sizes will be removed — weighed products are sold by the kilo.</p>
            )
          ) : (
            <div className="flex flex-col gap-3">
              <div>
                <p className="text-sm font-semibold text-gray-800 flex items-center gap-1.5">
                  <Package size={14} className="text-indigo-500" /> Pack sizes
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  Sell a pack from the same stock: selling 1 pack of 20 takes 20 {unit} off the count. Give the pack its own barcode
                  if it has one.
                </p>
              </div>
              {packs.map((p, n) => {
                const each = Number(p.selling_price) / Number(p.quantity);
                return (
                  <div key={p._id ?? `new-${n}`} className="rounded-xl border border-gray-200 p-3 flex flex-col gap-2">
                    <div className="grid grid-cols-[1.3fr_0.8fr_1fr_auto] gap-2 items-end">
                      <label className="flex flex-col gap-1">
                        <span className={label}>Name</span>
                        <input value={p.name} onChange={set(n, "name")} maxLength={30} placeholder="Pack, Tray, Box" className={input} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={label}>{unit} inside</span>
                        <input type="number" min={2} step={1} value={p.quantity} onChange={set(n, "quantity")} placeholder="20" className={input} />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className={label}>Price</span>
                        <input type="number" min={0} step="0.25" value={p.selling_price} onChange={set(n, "selling_price")} placeholder="0.00" className={input} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setPacks((list) => list.filter((_, i) => i !== n))}
                        aria-label={`Remove ${p.name || "pack"}`}
                        className="p-2 mb-0.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                    <div className="grid grid-cols-[1fr_auto] gap-2 items-center">
                      <input value={p.barcode ?? ""} onChange={set(n, "barcode")} maxLength={60} placeholder="Pack barcode (optional)" className={`${input} font-mono`} />
                      {Number.isFinite(each) && each > 0 && (
                        <span className="text-xs text-gray-500 whitespace-nowrap tabular-nums">
                          {peso(each)} / {unit}
                          {each < piece_price && <span className="text-green-600"> · saves {peso((piece_price - each) * Number(p.quantity))}</span>}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              {packs.length < 5 && (
                <button
                  type="button"
                  onClick={() => setPacks((list) => [...list, blank_pack()])}
                  className="self-start text-sm font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                >
                  <Plus size={14} /> Add pack size
                </button>
              )}
            </div>
          )}

          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">⚠ {error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" size="md" className="w-full!" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="w-full!" onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>,
    document.body,
  );
};

// Selling price cell: the price, its pack sizes / "per kg", and (when
// allowed) a button to edit them.
export const EditableSelling = ({ product, editable, onUpdate, formatPrice }) => {
  const [open, setOpen] = useState(false);
  const unit = product.unit || "pc";
  return (
    <>
      <div className="flex flex-col gap-1">
        <span className="flex items-center gap-1.5 text-sm font-medium text-gray-900">
          {formatPrice(product.pricing?.selling_price)}
          {product.sold_by_weight && <span className="text-xs font-normal text-gray-400">/ {unit}</span>}
          {editable && (
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label={`Selling options of ${product.name}`}
              title="Pack sizes and selling by weight"
              className="p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500"
            >
              <Settings2 size={12} />
            </button>
          )}
        </span>
        {product.packs?.length > 0 && (
          <span className="flex flex-wrap gap-1">
            {product.packs.map((k) => (
              <span key={k._id} className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 whitespace-nowrap">
                {k.name} of {k.quantity}: {formatPrice(k.selling_price)}
              </span>
            ))}
          </span>
        )}
      </div>
      {open && <SellingDialog product={product} onUpdate={onUpdate} onClose={() => setOpen(false)} />}
    </>
  );
};

import { useMemo, useState } from "react";
import { Package, Scale, Search } from "lucide-react";
import { units_of } from "../../hooks/use_cart";

const round_qty = (n) => Math.round(n * 1000) / 1000;

// Browsable grid of the branch's products. Each card shows the live
// available quantity (inventory stock minus what's already in the cart)
// and adds the product to the cart on click; pack sizes get their own
// buttons. onPick(product, pack?) — weighed products open the scale.
export const ProductGrid = ({ products, cartItems, onPick }) => {
  const [filter, setFilter] = useState("");

  // Stock units of each inventory row already in the cart (packs count
  // their pieces).
  const inCart = useMemo(() => {
    const map = new Map();
    for (const i of cartItems) {
      if (!i.is_custom) map.set(i.inventory_id, (map.get(i.inventory_id) ?? 0) + units_of(i));
    }
    return map;
  }, [cartItems]);

  const visible = useMemo(() => {
    const q = filter.trim().toLowerCase();
    const list = !q
      ? products
      : products.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.brand.toLowerCase().includes(q) ||
            p.category?.toLowerCase().includes(q) ||
            p.barcode.includes(q),
        );
    return [...list].sort((a, b) => a.name.localeCompare(b.name));
  }, [products, filter]);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col flex-1 min-h-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
          <Package size={16} className="text-indigo-500" />
          Available Products
          <span className="text-xs font-normal text-gray-400">
            ({visible.length})
          </span>
        </h2>
        <div className="relative w-48">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-300"
          />
          <input
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Filter list..."
            className="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4">
        {visible.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-gray-400 py-10">
            <Package size={28} className="mb-2 text-gray-300" />
            <p className="text-sm">No products to show</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
            {visible.map((p) => {
              const remaining = round_qty((p.stock_management?.current_stock ?? 0) - (inCart.get(p._id) ?? 0));
              const reorder = p.stock_management?.reorder_level ?? 0;
              const out = remaining <= 0;
              const low = !out && remaining <= reorder;
              const per = p.sold_by_weight ? ` / ${p.unit || "kg"}` : "";

              return (
                <div
                  key={p._id}
                  className={`rounded-xl border flex flex-col transition-all ${
                    out
                      ? "border-gray-100 bg-gray-50 opacity-60"
                      : "border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 bg-white"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => !out && onPick(p)}
                    disabled={out}
                    title={out ? "Out of stock" : p.sold_by_weight ? `Weigh ${p.name}` : `Add ${p.name}`}
                    className={`flex-1 text-left p-3 flex flex-col gap-2 ${out ? "cursor-not-allowed" : "cursor-pointer"}`}
                  >
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                        {p.sold_by_weight && <Scale size={12} className="inline mr-1 -mt-0.5 text-indigo-400" />}
                        {p.name}
                      </p>
                      <p className="text-[11px] text-gray-400 mt-0.5">{p.brand}</p>
                    </div>

                    <div className="flex items-end justify-between gap-1">
                      <span className="text-sm font-bold text-indigo-600">
                        ₱{p.pricing.selling_price.toFixed(2)}
                        <span className="text-[11px] font-normal text-gray-400">{per}</span>
                      </span>
                      <span
                        className={`text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${
                          out
                            ? "bg-red-50 text-red-500"
                            : low
                              ? "bg-amber-50 text-amber-600"
                              : "bg-emerald-50 text-emerald-600"
                        }`}
                      >
                        {out ? "Out of stock" : `Qty: ${remaining}${p.sold_by_weight ? ` ${p.unit || "kg"}` : ""}`}
                      </span>
                    </div>
                  </button>
                  {!p.sold_by_weight && p.packs?.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-3 pb-3">
                      {p.packs.map((k) => (
                        <button
                          key={k._id}
                          type="button"
                          onClick={() => onPick(p, k)}
                          disabled={remaining < k.quantity}
                          title={`Add 1 ${k.name} (${k.quantity} ${p.unit || "pcs"})`}
                          className="text-[11px] font-semibold px-2 py-1 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          + {k.name} ₱{k.selling_price.toFixed(2)}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

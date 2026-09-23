import { useMemo, useState } from "react";
import { Package, Search } from "lucide-react";

// Browsable grid of the branch's products. Each card shows the live
// available quantity (inventory stock minus what's already in the cart)
// and adds the product to the cart on click.
export const ProductGrid = ({ products, cartItems, onPick }) => {
  const [filter, setFilter] = useState("");

  // How many of each inventory row are already in the cart.
  const inCart = useMemo(() => {
    const map = new Map();
    for (const i of cartItems) {
      if (!i.is_custom) map.set(i.inventory_id, i.quantity);
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
              const remaining =
                (p.stock_management?.current_stock ?? 0) -
                (inCart.get(p._id) ?? 0);
              const reorder = p.stock_management?.reorder_level ?? 0;
              const out = remaining <= 0;
              const low = !out && remaining <= reorder;

              return (
                <button
                  key={p._id}
                  onClick={() => !out && onPick(p)}
                  disabled={out}
                  title={out ? "Out of stock" : `Add ${p.name}`}
                  className={`text-left rounded-xl border p-3 flex flex-col gap-2 transition-all ${
                    out
                      ? "border-gray-100 bg-gray-50 opacity-60 cursor-not-allowed"
                      : "border-gray-200 hover:border-indigo-300 hover:shadow-md hover:-translate-y-0.5 bg-white cursor-pointer"
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900 leading-snug line-clamp-2">
                      {p.name}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{p.brand}</p>
                  </div>

                  <div className="flex items-end justify-between">
                    <span className="text-sm font-bold text-indigo-600">
                      ₱{p.pricing.selling_price.toFixed(2)}
                    </span>
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        out
                          ? "bg-red-50 text-red-500"
                          : low
                            ? "bg-amber-50 text-amber-600"
                            : "bg-emerald-50 text-emerald-600"
                      }`}
                    >
                      {out ? "Out of stock" : `Qty: ${remaining}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

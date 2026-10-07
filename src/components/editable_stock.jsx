import { useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "./buttons";
import { is_qty, peso, round_qty } from "../utils/format";
import axios from "axios";

// Why the count changed. Deliveries and sales update stock on their own,
// so manual changes are for losses and corrections only.
const ADJUSTMENT_REASONS = [
  { key: "count", label: "Stock count correction", both: true },
  { key: "damaged", label: "Damaged" },
  { key: "expired", label: "Expired" },
  { key: "lost", label: "Lost / stolen" },
  { key: "returned", label: "Returned to supplier" },
  { key: "other", label: "Other (explain in note)", both: true },
];

const input =
  "w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300";
const label = "text-xs font-semibold text-gray-500 uppercase tracking-wide";

// Mounted only while open, so it starts from the current values.
const StockDialog = ({ productId, name, cost = 0, by_weight = false, stock_management, onUpdate, onClose }) => {
  const before = Number(stock_management.current_stock) || 0;
  const [form, setForm] = useState({
    current_stock: before,
    reorder_level: stock_management.reorder_level,
    critical_level: stock_management.critical_level ?? 0,
    target_stock: stock_management.target_stock ?? 0,
    supplier: stock_management.supplier ?? "",
    supplier_sku: stock_management.supplier_sku ?? "",
    reason: "",
    note: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const after = form.current_stock === "" ? before : Number(form.current_stock);
  const change = round_qty(after - before);
  const reasons = ADJUSTMENT_REASONS.filter((r) => change <= 0 || r.both);
  const reason_ok = change === 0 || reasons.some((r) => r.key === form.reason);

  const save = async () => {
    if (form.current_stock === "" || form.reorder_level === "") {
      return setError("Stock and reorder level are required.");
    }
    if (!is_qty(after, by_weight, true)) {
      return setError(by_weight ? "Stock must be 0 or more, up to 3 decimals." : "Stock must be a whole number of 0 or more.");
    }
    if (!reason_ok) return setError("Choose why the stock count changed.");
    if (change !== 0 && form.reason === "other" && !form.note.trim()) {
      return setError("Add a note explaining the change.");
    }
    setLoading(true);
    try {
      const levels = {
        reorder_level: Number(form.reorder_level),
        critical_level: Number(form.critical_level) || 0,
        target_stock: Number(form.target_stock) || 0,
        supplier: form.supplier,
        supplier_sku: form.supplier_sku,
      };
      const { data } = await axios.patch(`/api/products/${productId}/stock`, {
        current_stock: after,
        ...levels,
        ...(change !== 0 && { reason: form.reason, note: form.note.trim() }),
      });
      if (!data.success) throw new Error(data.message);
      onUpdate({ ...stock_management, current_stock: after, ...levels });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={loading ? undefined : onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Adjust stock"
        onKeyDown={(e) => e.key === "Escape" && !loading && onClose()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-y-auto max-h-[92vh]"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="min-w-0">
            <p className="text-sm font-bold text-gray-900">Adjust stock</p>
            <p className="text-xs text-gray-400 truncate">{name ?? "Update stock details"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <span className={label}>On record</span>
              <p className="px-3 py-2.5 text-sm rounded-lg bg-gray-50 text-gray-500 tabular-nums">{before}</p>
            </div>
            <label className="flex flex-col gap-1.5">
              <span className={label}>
                Actual count <span className="text-red-400">*</span>
              </span>
              <input autoFocus type="number" min={0} step={by_weight ? 0.001 : 1} value={form.current_stock} onChange={set("current_stock")} className={input} />
            </label>
          </div>

          {change !== 0 && (
            <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className={`text-sm font-semibold ${change < 0 ? "text-red-600" : "text-green-700"}`}>
                {change > 0 ? "+" : "−"}
                {Math.abs(change)} unit(s)
                {cost > 0 && (
                  <span className="font-normal text-gray-500">
                    {" "}
                    · {change < 0 ? "loss" : "value"} {peso(Math.abs(change) * cost)}
                  </span>
                )}
              </p>
              <label className="flex flex-col gap-1.5">
                <span className={label}>
                  Reason <span className="text-red-400">*</span>
                </span>
                <select value={form.reason} onChange={set("reason")} className={`${input} bg-white`}>
                  <option value="">Choose a reason…</option>
                  {reasons.map((r) => (
                    <option key={r.key} value={r.key}>
                      {r.label}
                    </option>
                  ))}
                </select>
              </label>
              {change > 0 && (
                <p className="text-xs text-gray-500">New delivery? Use Receiving instead so it's tracked against the supplier.</p>
              )}
              <label className="flex flex-col gap-1.5">
                <span className={label}>
                  Note {form.reason === "other" ? <span className="text-red-400">*</span> : <span className="font-normal normal-case text-gray-300">(optional)</span>}
                </span>
                <input value={form.note} onChange={set("note")} maxLength={300} placeholder="e.g. 3 cans dented in transit" className={`${input} bg-white`} />
              </label>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={label}>
                Reorder at <span className="text-red-400">*</span>
              </span>
              <input type="number" min={0} value={form.reorder_level} onChange={set("reorder_level")} className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Critical at</span>
              <input type="number" min={0} value={form.critical_level} onChange={set("critical_level")} className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Order up to</span>
              <input type="number" min={0} value={form.target_stock} onChange={set("target_stock")} placeholder="auto" className={input} />
            </label>
          </div>
          <span className="-mt-2 text-xs text-gray-400">Low stock alerts and restock orders start at &quot;Reorder at&quot;. 0 in the other two = not used / automatic.</span>
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1.5">
              <span className={label}>Supplier</span>
              <input value={form.supplier} onChange={set("supplier")} placeholder="e.g. NutriAsia" className={input} />
            </label>
            <label className="flex flex-col gap-1.5">
              <span className={label}>Supplier SKU</span>
              <input value={form.supplier_sku} onChange={set("supplier_sku")} maxLength={60} className={input} />
            </label>
          </div>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">⚠ {error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" size="md" className="w-full!" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="w-full!" onClick={save} disabled={loading || !reason_ok}>
            {loading ? "Saving..." : "Save"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export const EditableStock = ({ productId, name, cost, by_weight, stock_management, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  return (
    <>
      <div className="flex items-center gap-2">
        {stock_management.current_stock}
        <button
          type="button"
          onClick={() => setEditing(true)}
          aria-label={`Adjust stock${name ? ` of ${name}` : ""}`}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Pencil size={12} />
        </button>
      </div>
      {editing && (
        <StockDialog
          productId={productId}
          name={name}
          cost={cost}
          by_weight={by_weight}
          stock_management={stock_management}
          onUpdate={onUpdate}
          onClose={() => setEditing(false)}
        />
      )}
    </>
  );
};

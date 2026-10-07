import { useContext, useMemo, useState } from "react";
import axios from "axios";
import { KeyRound, RotateCcw, X } from "lucide-react";
import { AppContext } from "../../context/app_context";
import { peso, qty_label, round_qty } from "../../utils/format";

const REASONS = ["Damaged", "Expired", "Wrong item", "Customer changed mind", "Other"];
const c = (n) => Math.round(Number(n) * 100);

// Same formula as the server (order_controller.refund_order): what the
// customer actually paid per line, after discounts, in centavos.
const refund_preview = (order, qty) => {
  const ratio = order.subtotal > 0 ? order.total / order.subtotal : 0;
  let total_c = 0;
  order.items.forEach((item, line) => {
    const q = qty[line] ?? 0;
    if (!q) return;
    const remaining = round_qty(item.quantity - (item.refunded_qty ?? 0));
    const line_value_c = Math.round(c(item.subtotal) * ratio);
    total_c +=
      q === remaining
        ? line_value_c - c(item.refunded_amount ?? 0)
        : Math.round((line_value_c * q) / item.quantity);
  });
  return Math.min(total_c, c(order.total) - c(order.refunded_amount ?? 0)) / 100;
};

export const RefundModal = ({ order, onClose, onSuccess }) => {
  const { userData } = useContext(AppContext);
  const needs_pin = userData?.role === "employee";
  const [qty, setQty] = useState({});
  const [restock, setRestock] = useState({});
  const [reason, setReason] = useState(REASONS[0]);
  const [other, setOther] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const amount = useMemo(() => refund_preview(order, qty), [order, qty]);
  const selected = Object.entries(qty).filter(([, q]) => q > 0);
  const method = order.payment?.method ?? "cash";

  // Whole units, or kilos to the gram for weighed lines.
  const set_qty = (line, value, max, by_weight) => {
    const n = Number(value) || 0;
    setQty((q) => ({ ...q, [line]: Math.max(0, Math.min(max, by_weight ? round_qty(n) : Math.floor(n))) }));
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const { data } = await axios.post(`/api/orders/${order._id}/refund`, {
        items: selected.map(([line, quantity]) => ({
          line: Number(line),
          quantity,
          restock: restock[line] !== false,
        })),
        reason: reason === "Other" ? other.trim() || "Other" : reason,
        approval: needs_pin ? { pin } : undefined,
      });
      onSuccess(data.order);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
      if (["INVALID_PIN", "APPROVAL_REQUIRED"].includes(err.response?.data?.code)) setPin("");
    } finally {
      setBusy(false);
    }
  };

  const can_submit =
    selected.length > 0 && !busy && (!needs_pin || /^\d{4,6}$/.test(pin)) && (reason !== "Other" || other.trim());

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={busy ? undefined : onClose} />
      <div role="dialog" aria-modal="true" aria-label="Refund" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[92vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="p-2 bg-orange-100 rounded-xl text-orange-600"><RotateCcw size={18} /></span>
            <div>
              <p className="text-base font-bold text-gray-900">Refund items</p>
              <p className="text-xs text-gray-400">{order.order_number}</p>
            </div>
          </div>
          <button type="button" onClick={onClose} disabled={busy} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          <div className="border border-gray-100 rounded-xl divide-y divide-gray-50">
            {order.items.map((item, line) => {
              const remaining = round_qty(item.quantity - (item.refunded_qty ?? 0));
              return (
                <div key={line} className="px-3 py-2.5 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 truncate">{item.product_snapshot?.name}</p>
                    <p className="text-xs text-gray-400">
                      Bought {qty_label(item)}
                      {item.refunded_qty ? ` · ${round_qty(item.refunded_qty)} already refunded` : ""}
                    </p>
                    {remaining > 0 && item.inventory && (qty[line] ?? 0) > 0 && (
                      <label className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
                        <input
                          type="checkbox"
                          checked={restock[line] !== false}
                          onChange={(e) => setRestock((r) => ({ ...r, [line]: e.target.checked }))}
                        />
                        Put back on the shelf
                      </label>
                    )}
                  </div>
                  {remaining > 0 ? (
                    <input
                      type="number"
                      min={0}
                      max={remaining}
                      step={item.by_weight ? 0.001 : 1}
                      inputMode={item.by_weight ? "decimal" : "numeric"}
                      aria-label={`Quantity to refund of ${item.product_snapshot?.name}`}
                      value={qty[line] ?? 0}
                      onChange={(e) => set_qty(line, e.target.value, remaining, item.by_weight)}
                      className="w-16 text-center px-2 py-1.5 text-sm border border-gray-200 rounded-lg"
                    />
                  ) : (
                    <span className="text-xs text-gray-400">Refunded</span>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-wrap gap-2">
            {REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border ${
                  reason === r ? "bg-orange-500 text-white border-orange-500" : "bg-white text-gray-600 border-gray-200"
                }`}
              >
                {r}
              </button>
            ))}
          </div>
          {reason === "Other" && (
            <input value={other} onChange={(e) => setOther(e.target.value)} placeholder="Describe the reason" aria-label="Reason" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
          )}

          {needs_pin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2"><KeyRound size={15} /> Manager approval</p>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                autoComplete="off"
                aria-label="Manager PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
                placeholder="••••"
                className="w-full px-4 py-2.5 text-lg tracking-[0.5em] text-center border-2 border-amber-200 rounded-xl bg-white"
              />
            </div>
          )}

          {error && <p className="text-xs text-red-600 bg-red-50 px-3 py-2 rounded-lg">⚠ {error}</p>}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex items-center gap-3">
          <div className="flex-1 text-sm">
            <p className="text-gray-500">Refund {method === "cash" ? "in cash from your drawer" : `via ${method.toUpperCase()}`}</p>
            <p className="text-xl font-bold text-gray-900 tabular-nums">{peso(amount)}</p>
          </div>
          <button
            type="button"
            onClick={submit}
            disabled={!can_submit}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold disabled:opacity-50"
          >
            {busy ? "Refunding..." : "Refund"}
          </button>
        </div>
      </div>
    </div>
  );
};

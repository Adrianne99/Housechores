import { useState, useRef, useContext } from "react";
import { Link } from "react-router";
import { Banknote, CreditCard, KeyRound, Landmark, Smartphone, X } from "lucide-react";
import axios from "axios";

import { Button } from "../buttons";
import { AppContext } from "../../context/app_context";
import { discount_approval } from "../../utils/pricing";
import { ROLE_PREFIX } from "../../constants/navigation";
import { cn } from "../../utils/utils";
import { enqueue, is_network_error, new_client_ref } from "../../lib/offline_sales";
import { useStoreSettings } from "../../hooks/use_settings";
import { DEFAULT_PAYMENT_METHODS, method_key } from "../../utils/format";
import { line_total, units_of } from "../../hooks/use_cart";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

const ICONS = { cash: Banknote, card: CreditCard, bank_transfer: Landmark };

const APPROVAL_TEXT = {
  senior_pwd: "Senior/PWD discounts need a manager's approval.",
  large: "Discounts above 20% need a manager's approval.",
};

// Receipt-shaped order for a sale saved offline (the server makes the real one).
const offline_order = (payload, items, totals, discount, userData) => ({
  offline: true,
  _id: payload.client_ref,
  order_number: `OFFLINE-${payload.client_ref.slice(0, 8).toUpperCase()}`,
  offline_sold_at: payload.offline_sold_at,
  createdAt: payload.offline_sold_at,
  cashier: { name: userData?.name },
  branch: userData?.branch && typeof userData.branch === "object" ? userData.branch : null,
  items: items.map((i) => ({
    inventory: i.is_custom ? null : i.inventory_id,
    product_snapshot: { name: i.name, unit: i.unit },
    quantity: i.quantity,
    by_weight: i.by_weight || undefined,
    base_qty: units_of(i),
    unit_price: i.unit_price,
    subtotal: line_total(i),
  })),
  subtotal: totals.subtotal,
  discount_amount: totals.discount_amount ?? 0,
  discount,
  total: totals.total,
  vat_amount: totals.vat_amount ?? 0,
  vat_exempt: !!totals.vat_exempt,
  payment: {
    ...payload.payment,
    change: payload.payment.method === "cash" ? Math.round((payload.payment.amount_tendered - totals.total) * 100) / 100 : 0,
  },
});

// Mounted only while open, so each sale starts with a clean form.
export const ChargeModal = (props) => (props.open ? <ChargeModalBody {...props} /> : null);

const ChargeModalBody = ({ onClose, total, subtotal, totals, items, discount, branch, onSuccess }) => {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const methods = (useStoreSettings()?.payment_methods ?? DEFAULT_PAYMENT_METHODS).map((label) => ({
    key: method_key(label),
    label,
    icon: ICONS[method_key(label)] ?? Smartphone,
  }));
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const inputRef = useRef(null);
  const pinRef = useRef(null);

  // Managers/admins approve their own discounts; cashiers need a PIN.
  const approval_reason = discount_approval(discount, subtotal ?? total);
  const needs_pin = !!approval_reason && userData?.role === "employee";

  const is_cash = method === "cash";
  const tenderedNum = Number(tendered) || 0;
  const change = +(tenderedNum - total).toFixed(2);
  const enough = !is_cash || tenderedNum >= total;
  const pin_ok = !needs_pin || /^\d{4,6}$/.test(pin);
  const can_submit = enough && pin_ok && !loading;

  const handleSubmit = async () => {
    if (!enough) return setError("Cash tendered is less than total.");
    if (!pin_ok) {
      pinRef.current?.focus();
      return setError("Enter the manager's 4–6 digit PIN.");
    }

    setLoading(true);
    setError(null);
    setErrorCode(null);
    const payload = {
      // Same ref on retries, so a sale can't be recorded twice.
      client_ref: new_client_ref(),
      branch: is_admin ? branch : undefined,
      items: items.map((i) =>
        i.is_custom
          ? { is_custom: true, name: i.name, brand: i.brand, unit: i.unit, unit_price: i.unit_price, quantity: i.quantity }
          : {
              inventory_id: i.inventory_id,
              pack_id: i.pack_id || undefined,
              // "₱20 worth": the server charges exactly this amount.
              ...(i.amount != null ? { amount: i.amount } : { quantity: i.quantity }),
            },
      ),
      discount: discount || undefined,
      approval: needs_pin ? { pin } : undefined,
      payment: is_cash
        ? { method: "cash", amount_tendered: tenderedNum }
        : { method, reference: reference.trim() || undefined },
    };
    try {
      const { data } = await axios.post(`/api/orders`, payload);
      if (!data.success) throw new Error(data.message || "Failed to complete sale.");
      onSuccess(data.order);
    } catch (err) {
      // No connection: keep the sale on this device and sync it later.
      if (is_network_error(err)) {
        payload.offline_sold_at = new Date().toISOString();
        enqueue(payload, total);
        onSuccess(offline_order(payload, items, totals ?? { subtotal, total }, discount, userData));
        return;
      }
      const code = err.response?.data?.code;
      setErrorCode(code ?? null);
      setError(err.response?.data?.message || err.message);
      if (code === "INVALID_PIN" || code === "APPROVAL_REQUIRED") {
        setPin("");
        pinRef.current?.focus();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && can_submit && e.target.tagName !== "BUTTON") handleSubmit();
    if (e.key === "Escape" && !loading) onClose();
  };

  const prefix = ROLE_PREFIX[userData?.role] ?? "/employee";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" onKeyDown={handleKeyDown}>
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={loading ? undefined : onClose} />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Charge"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden max-h-[95vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Banknote size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Payment</p>
              <p className="text-xs text-gray-400">Choose how the customer pays</p>
            </div>
          </div>
          <button onClick={onClose} disabled={loading} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40">
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="text-center bg-gray-50 rounded-2xl py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Total Due</p>
            <p className="text-4xl font-bold text-indigo-600 tabular-nums">₱{total.toFixed(2)}</p>
          </div>

          {/* Cash-only stores (one method in Store Settings) skip the picker. */}
          <div className={cn("grid grid-cols-3 gap-2", methods.length < 2 && "hidden")} role="radiogroup" aria-label="Payment method">
            {methods.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                role="radio"
                aria-checked={method === key}
                onClick={() => {
                  setMethod(key);
                  setError(null);
                }}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors",
                  method === key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600 hover:bg-gray-50",
                )}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>

          {is_cash ? (
            <>
              <div className="space-y-2">
                <label htmlFor="tendered" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Amount Tendered
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">₱</span>
                  <input
                    id="tendered"
                    ref={inputRef}
                    autoFocus
                    type="number"
                    inputMode="decimal"
                    value={tendered}
                    onChange={(e) => {
                      setTendered(e.target.value);
                      setError(null);
                    }}
                    placeholder="0.00"
                    className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 tabular-nums"
                  />
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button type="button" onClick={() => setTendered(String(total))} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100">
                    Exact
                  </button>
                  {QUICK_AMOUNTS.filter((a) => a >= total).map((amt) => (
                    <button key={amt} type="button" onClick={() => setTendered(String(amt))} className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200">
                      ₱{amt}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`rounded-xl p-4 border ${enough && tendered ? "bg-green-50 border-green-100" : "bg-gray-50 border-gray-100"}`}>
                <p className="text-xs text-gray-500 mb-1">Change to give back</p>
                <p className={`text-2xl font-bold tabular-nums ${enough && tendered ? "text-green-600" : "text-gray-300"}`}>
                  ₱{enough ? change.toFixed(2) : "0.00"}
                </p>
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label htmlFor="reference" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {methods.find((m) => m.key === method)?.label} reference no.{" "}
                <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="reference"
                ref={inputRef}
                autoFocus
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. 1012 345 678901"
                className="w-full px-4 py-3 text-base border-2 border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400"
              />
              <p className="text-xs text-gray-400">Confirm the payment went through before completing the sale.</p>
            </div>
          )}

          {needs_pin && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2">
              <p className="text-sm font-semibold text-amber-800 flex items-center gap-2">
                <KeyRound size={16} /> Manager approval
              </p>
              <p className="text-xs text-amber-700">
                {APPROVAL_TEXT[approval_reason]} Ask your manager to enter their PIN. It will be logged.
              </p>
              <input
                ref={pinRef}
                type="password"
                inputMode="numeric"
                autoComplete="off"
                maxLength={6}
                aria-label="Manager PIN"
                value={pin}
                onChange={(e) => {
                  setPin(e.target.value.replace(/\D/g, ""));
                  setError(null);
                }}
                placeholder="••••"
                className="w-full px-4 py-3 text-xl tracking-[0.5em] text-center border-2 border-amber-200 rounded-xl outline-none focus:border-amber-400 bg-white"
              />
            </div>
          )}

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}{" "}
              {errorCode === "DRAWER_CLOSED" && (
                <Link to={`${prefix}/cash-drawer`} className="font-semibold underline">
                  Open cash drawer
                </Link>
              )}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" size="md" className="w-full" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="w-full" onClick={handleSubmit} disabled={!can_submit}>
            {loading ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
};

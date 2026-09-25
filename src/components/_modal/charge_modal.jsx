import { useState, useRef, useContext, useMemo } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Banknote, BookUser, CreditCard, KeyRound, Plus, Smartphone, X } from "lucide-react";
import axios from "axios";

import { Button } from "../buttons";
import { AppContext } from "../../context/app_context";
import { discount_approval } from "../../utils/pricing";
import { ROLE_PREFIX } from "../../constants/navigation";
import { cn } from "../../utils/utils";
import { get, queryClient, error_message } from "../../lib/query";
import { enqueue, is_network_error, new_client_ref } from "../../lib/offline_sales";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];
const NONE = [];
const c = (n) => Math.round(Number(n || 0) * 100);
const money = (n) => `₱${Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const METHODS = [
  { key: "cash", label: "Cash", icon: Banknote },
  { key: "gcash", label: "GCash", icon: Smartphone },
  { key: "card", label: "Card", icon: CreditCard },
  { key: "credit", label: "Utang", icon: BookUser },
];

const APPROVAL_TEXT = {
  senior_pwd: "Senior/PWD discounts need a manager's approval.",
  large: "Discounts above 20% need a manager's approval.",
  credit: "This utang goes over the customer's credit limit.",
};

// Receipt-shaped order for a sale saved offline (the server makes the real one).
const offline_order = (payload, items, totals, discount, userData, customer) => ({
  offline: true,
  _id: payload.client_ref,
  order_number: `OFFLINE-${payload.client_ref.slice(0, 8).toUpperCase()}`,
  offline_sold_at: payload.offline_sold_at,
  createdAt: payload.offline_sold_at,
  cashier: { name: userData?.name },
  branch: userData?.branch && typeof userData.branch === "object" ? userData.branch : null,
  items: items.map((i) => ({
    inventory: i.is_custom ? null : i.inventory_id,
    product_snapshot: { name: i.name },
    quantity: i.quantity,
    unit_price: i.unit_price,
    subtotal: Math.round(i.unit_price * i.quantity * 100) / 100,
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
    customer_name: customer?.name,
  },
});

// Pick (or quickly add) the utang customer.
const CustomerPicker = ({ branch, is_admin, total, value, onChange }) => {
  const [query, setQuery] = useState("");
  const [adding, setAdding] = useState(null); // { name, phone, busy, error }
  const q = useQuery({
    queryKey: ["customers", "picker", is_admin ? branch : "mine"],
    queryFn: () => get("/api/customers", is_admin && branch ? { branch } : undefined),
  });
  const customers = q.data?.customers ?? NONE;
  const shown = useMemo(() => {
    const s = query.trim().toLowerCase();
    return (s ? customers.filter((x) => x.name.toLowerCase().includes(s) || x.phone?.includes(s)) : customers).slice(0, 6);
  }, [customers, query]);

  const add = async () => {
    setAdding((a) => ({ ...a, busy: true, error: null }));
    try {
      const { data } = await axios.post("/api/customers", { name: adding.name, phone: adding.phone, branch: is_admin ? branch : undefined });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      onChange(data.customer);
      setAdding(null);
    } catch (err) {
      setAdding((a) => ({ ...a, busy: false, error: error_message(err) }));
    }
  };

  if (value) {
    const after = (c(value.balance) + c(total)) / 100;
    const over = value.credit_limit > 0 && c(after) > c(value.credit_limit);
    return (
      <div className={cn("rounded-xl border p-3 text-sm", over ? "border-amber-300 bg-amber-50" : "border-indigo-200 bg-indigo-50")}>
        <div className="flex items-center justify-between gap-2">
          <p className="font-semibold text-gray-900">{value.name}</p>
          <button type="button" onClick={() => onChange(null)} className="text-xs text-indigo-600 underline">Change</button>
        </div>
        <p className="text-xs text-gray-600 mt-1">
          Owes {money(value.balance)} → <b>{money(after)}</b> after this sale
          {value.credit_limit > 0 ? ` · limit ${money(value.credit_limit)}` : " · no limit"}
        </p>
      </div>
    );
  }
  return (
    <div className="space-y-2">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search customer name or number"
        aria-label="Search customer"
        className="w-full px-3 py-2.5 text-sm border-2 border-gray-200 rounded-xl outline-none focus:border-indigo-400"
      />
      <ul className="max-h-44 overflow-y-auto divide-y divide-gray-50 rounded-xl border border-gray-100">
        {q.isPending ? (
          <li className="px-3 py-2 text-xs text-gray-400">Loading...</li>
        ) : shown.length === 0 ? (
          <li className="px-3 py-2 text-xs text-gray-400">No customers found.</li>
        ) : (
          shown.map((x) => (
            <li key={x._id}>
              <button type="button" onClick={() => onChange(x)} className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between gap-2 text-sm">
                <span>
                  {x.name}
                  {x.phone && <span className="block text-xs text-gray-400">{x.phone}</span>}
                </span>
                <span className={cn("text-xs shrink-0", x.balance > 0 ? "text-orange-600" : "text-gray-400")}>owes {money(x.balance)}</span>
              </button>
            </li>
          ))
        )}
      </ul>
      {adding ? (
        <div className="rounded-xl border border-gray-200 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <input autoFocus value={adding.name} onChange={(e) => setAdding((a) => ({ ...a, name: e.target.value }))} placeholder="Name" aria-label="New customer name" className="px-2 py-1.5 text-sm border border-gray-200 rounded-md" />
            <input value={adding.phone} onChange={(e) => setAdding((a) => ({ ...a, phone: e.target.value }))} placeholder="Mobile (optional)" aria-label="New customer mobile" className="px-2 py-1.5 text-sm border border-gray-200 rounded-md" />
          </div>
          {adding.error && <p className="text-xs text-red-600">{adding.error}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setAdding(null)} className="px-3 py-1 text-xs rounded-md border border-gray-200">Cancel</button>
            <button type="button" onClick={add} disabled={adding.busy || !adding.name.trim()} className="px-3 py-1 text-xs rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-50">
              {adding.busy ? "Adding..." : "Add customer"}
            </button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAdding({ name: query, phone: "" })} className="flex items-center gap-1 text-xs font-semibold text-indigo-600">
          <Plus size={12} /> New customer
        </button>
      )}
    </div>
  );
};

// Mounted only while open, so each sale starts with a clean form.
export const ChargeModal = (props) => (props.open ? <ChargeModalBody {...props} /> : null);

const ChargeModalBody = ({ onClose, total, subtotal, totals, items, discount, branch, onSuccess }) => {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [method, setMethod] = useState("cash");
  const [tendered, setTendered] = useState("");
  const [reference, setReference] = useState("");
  const [customer, setCustomer] = useState(null);
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [errorCode, setErrorCode] = useState(null);
  const inputRef = useRef(null);
  const pinRef = useRef(null);

  // Managers/admins approve their own discounts; cashiers need a PIN.
  const discount_reason = discount_approval(discount, subtotal ?? total);
  const credit_over =
    method === "credit" && customer && customer.credit_limit > 0 && c(customer.balance) + c(total) > c(customer.credit_limit);
  const approval_reason = discount_reason ?? (credit_over ? "credit" : null);
  const needs_pin = !!approval_reason && userData?.role === "employee";

  const is_cash = method === "cash";
  const tenderedNum = Number(tendered) || 0;
  const change = +(tenderedNum - total).toFixed(2);
  const enough = !is_cash || tenderedNum >= total;
  const pin_ok = !needs_pin || /^\d{4,6}$/.test(pin);
  const customer_ok = method !== "credit" || !!customer;
  const can_submit = enough && pin_ok && customer_ok && !loading;

  const handleSubmit = async () => {
    if (!enough) return setError("Cash tendered is less than total.");
    if (!customer_ok) return setError("Choose who the utang is for.");
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
          : { inventory_id: i.inventory_id, quantity: i.quantity },
      ),
      discount: discount || undefined,
      approval: needs_pin ? { pin } : undefined,
      payment: is_cash
        ? { method: "cash", amount_tendered: tenderedNum }
        : method === "credit"
          ? { method: "credit", customer_id: customer._id }
          : { method, reference: reference.trim() || undefined },
    };
    try {
      const { data } = await axios.post(`/api/orders`, payload);
      if (!data.success) throw new Error(data.message || "Failed to complete sale.");
      if (method === "credit") queryClient.invalidateQueries({ queryKey: ["customers"] });
      onSuccess(data.order);
    } catch (err) {
      // No connection: keep the sale on this device and sync it later.
      if (is_network_error(err)) {
        payload.offline_sold_at = new Date().toISOString();
        enqueue(payload, total);
        onSuccess(offline_order(payload, items, totals ?? { subtotal, total }, discount, userData, customer));
        return;
      }
      const code = err.response?.data?.code;
      setErrorCode(code ?? null);
      setError(err.response?.data?.message || err.message);
      if (["INVALID_PIN", "APPROVAL_REQUIRED", "CREDIT_LIMIT"].includes(code)) {
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

          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Payment method">
            {METHODS.map(({ key, label, icon: Icon }) => (
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
          ) : method === "credit" ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Charge to customer (utang)</p>
              <CustomerPicker branch={branch} is_admin={is_admin} total={total} value={customer} onChange={setCustomer} />
            </div>
          ) : (
            <div className="space-y-2">
              <label htmlFor="reference" className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                {method === "gcash" ? "GCash reference no." : "Card approval code"}{" "}
                <span className="normal-case font-normal text-gray-400">(optional)</span>
              </label>
              <input
                id="reference"
                ref={inputRef}
                autoFocus
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder={method === "gcash" ? "e.g. 1012 345 678901" : "e.g. 123456"}
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
            {loading ? "Processing..." : method === "credit" ? "Charge to Utang" : "Complete Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
};

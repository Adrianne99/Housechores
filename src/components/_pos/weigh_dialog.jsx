import { useState } from "react";
import { Scale, X } from "lucide-react";
import { Button } from "../buttons";
import { peso } from "../../utils/format";

const round_qty = (n) => Math.round(Number(n) * 1000) / 1000;
const QUICK_KG = [0.25, 0.5, 1, 2];
const QUICK_PESOS = [10, 20, 50, 100];

// Adds a product sold by weight: type the kilos from the scale, or the
// peso amount the customer asked for ("bente pesos na asukal").
// onAdd({ kg } | { amount }) returns null when added, or an error message.
export const WeighDialog = ({ product, onAdd, onClose }) => (product ? <Body product={product} onAdd={onAdd} onClose={onClose} /> : null);

const Body = ({ product, onAdd, onClose }) => {
  const [mode, setMode] = useState("kg");
  const [value, setValue] = useState("");
  const [error, setError] = useState(null);
  const price = product.pricing.selling_price;
  const unit = product.unit || "kg";
  const n = Number(value);
  const valid = value !== "" && Number.isFinite(n) && n > 0;
  const kg = mode === "kg" ? round_qty(n) : price > 0 ? round_qty(n / price) : 0;
  const amount = mode === "kg" ? Math.round(price * round_qty(n) * 100) / 100 : Math.round(n * 100) / 100;

  const add = (v = value) => {
    const num = Number(v);
    if (!(num > 0)) return setError(`Enter the ${mode === "kg" ? "weight" : "amount"}.`);
    const err = onAdd(product, mode === "kg" ? { kg: num } : { amount: num });
    if (err) return setError(err);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`Weigh ${product.name}`}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key === "Enter") add();
        }}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 bg-indigo-50 rounded-xl text-indigo-600">
              <Scale size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-gray-900 truncate">{product.name}</p>
              <p className="text-xs text-gray-400">
                {peso(price)} per {unit} · {round_qty(product.stock_management.current_stock)} {unit} in stock
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          <div className="grid grid-cols-2 gap-1 p-1 bg-gray-100 rounded-xl text-sm font-semibold">
            {[
              ["kg", `By weight (${unit})`],
              ["amount", "By amount (₱)"],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setMode(key);
                  setValue("");
                  setError(null);
                }}
                className={`py-2 rounded-lg ${mode === key ? "bg-white shadow-sm text-indigo-600" : "text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>

          <label className="block">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              {mode === "kg" ? `Weight on the scale (${unit})` : "Amount the customer wants"}
            </span>
            <input
              autoFocus
              key={mode}
              type="number"
              min={0}
              step={mode === "kg" ? 0.001 : 0.01}
              inputMode="decimal"
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              placeholder={mode === "kg" ? "e.g. 1.25" : "e.g. 20"}
              className="mt-1.5 w-full px-4 py-3 text-2xl font-bold tabular-nums border-2 border-indigo-200 rounded-xl outline-none focus:border-indigo-400"
            />
          </label>

          <div className="flex flex-wrap gap-2">
            {(mode === "kg" ? QUICK_KG : QUICK_PESOS).map((q) => (
              <button
                key={q}
                type="button"
                onClick={() => add(q)}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-gray-200 hover:border-indigo-300 hover:bg-indigo-50"
              >
                {mode === "kg" ? `${q} ${unit}` : peso(q)}
              </button>
            ))}
          </div>

          <p className="text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2 tabular-nums">
            {valid ? (
              <>
                {kg} {unit} = <b>{peso(amount)}</b>
              </>
            ) : (
              "Enter a weight or tap a quick amount."
            )}
          </p>
          {error && <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">⚠ {error}</p>}
        </div>

        <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" size="md" className="w-full!" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="md" className="w-full!" onClick={() => add()} disabled={!valid}>
            Add to cart
          </Button>
        </div>
      </div>
    </div>
  );
};

import { useState, useEffect, useRef } from "react";
import { Banknote, X } from "lucide-react";
import axios from "axios";

import { Button } from "../buttons";

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000];

export const ChargeModal = ({
  open,
  onClose,
  total,
  items,
  discount,
  onSuccess,
}) => {
  const [tendered, setTendered] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) {
      setTendered("");
      setError(null);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  if (!open) return null;

  const tenderedNum = Number(tendered) || 0;
  const change = +(tenderedNum - total).toFixed(2);
  const enough = tenderedNum >= total;

  const handleQuickAmount = (amt) => {
    setTendered(String(amt));
    setError(null);
  };

  const handleExactAmount = () => {
    setTendered(String(total));
    setError(null);
  };

  const handleSubmit = async () => {
    if (!enough) {
      setError("Cash tendered is less than total.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.post(`/api/orders`, {
        items: items.map((i) =>
          i.is_custom
            ? {
                is_custom: true,
                name: i.name,
                brand: i.brand,
                unit: i.unit,
                unit_price: i.unit_price,
                quantity: i.quantity,
              }
            : {
                inventory_id: i.inventory_id,
                quantity: i.quantity,
              },
        ),
        discount: discount || undefined,
        payment: {
          method: "cash",
          amount_tendered: tenderedNum,
        },
      });

      if (!data.success) {
        throw new Error(data.message || "Failed to complete sale.");
      }

      onSuccess(data.order);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && enough && !loading) {
      handleSubmit();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-100 rounded-xl">
              <Banknote size={18} className="text-green-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">Cash payment</p>
              <p className="text-xs text-gray-400">
                Enter the amount tendered by customer
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-40"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {/* Total */}
          <div className="text-center bg-gray-50 rounded-2xl py-4">
            <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">
              Total Due
            </p>
            <p className="text-4xl font-bold text-indigo-600 tabular-nums">
              ₱{total.toFixed(2)}
            </p>
          </div>

          {/* Tendered input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Amount Tendered
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-gray-400">
                ₱
              </span>
              <input
                ref={inputRef}
                type="number"
                value={tendered}
                onChange={(e) => {
                  setTendered(e.target.value);
                  setError(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="0.00"
                className="w-full pl-10 pr-4 py-4 text-2xl font-semibold border-2 border-gray-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 tabular-nums"
              />
            </div>

            {/* Quick amounts */}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={handleExactAmount}
                className="px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors"
              >
                Exact
              </button>
              {QUICK_AMOUNTS.filter((a) => a >= total).map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleQuickAmount(amt)}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
                >
                  ₱{amt}
                </button>
              ))}
            </div>
          </div>

          {/* Change */}
          <div
            className={`rounded-xl p-4 border ${
              enough && tendered
                ? "bg-green-50 border-green-100"
                : "bg-gray-50 border-gray-100"
            }`}
          >
            <p className="text-xs text-gray-500 mb-1">Change to give back</p>
            <p
              className={`text-2xl font-bold tabular-nums ${
                enough && tendered ? "text-green-600" : "text-gray-300"
              }`}
            >
              ₱{enough ? change.toFixed(2) : "0.00"}
            </p>
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSubmit}
            disabled={!enough || loading}
          >
            {loading ? "Processing..." : "Complete Sale"}
          </Button>
        </div>
      </div>
    </div>
  );
};

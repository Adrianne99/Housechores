import { useRef, useEffect, useState } from "react";
import {
  ArrowLeftRight,
  Pencil,
  Trash2,
  TrendingUp,
  Check,
  X,
} from "lucide-react"; // Added for visual flair
import { StockBadge } from "./badge";
import { Button } from "./buttons";

export const EditableStock = ({ productId, stock_management, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(stock_management);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setEditing(false);
        setForm(stock_management);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [stock_management]);

  const handleSave = async () => {
    if (!form.current_stock === "" || form.reorder_level === "") {
      setError("Current stock and reorder level are required.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_stock: Number(form.current_stock),
          reorder_level: Number(form.reorder_level),
          supplier: form.supplier,
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onUpdate(form);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Trigger — shows current stock level */}
      <div className="flex items-center gap-2">
        {form.current_stock}
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Pencil size={12} />
        </button>
      </div>

      {/* Popover */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={() => {
              setEditing(false);
              setForm(stock_management);
            }}
          />
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">Edit Stock</p>
                <p className="text-xs text-gray-400">
                  Update stock management details
                </p>
              </div>
              <button
                onClick={() => {
                  setEditing(false);
                  setForm(stock_management);
                }}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Fields */}
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Current Stock <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.current_stock}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      current_stock: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Reorder Level <span className="text-red-400">*</span>
                </label>
                <input
                  type="number"
                  value={form.reorder_level}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      reorder_level: e.target.value,
                    }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
                />
                <p className="text-xs text-gray-400">
                  Alert triggers when stock falls below this number
                </p>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Supplier
                </label>
                <input
                  type="text"
                  value={form.supplier}
                  placeholder="e.g. NutriAsia"
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, supplier: e.target.value }))
                  }
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                />
              </div>

              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  ⚠ {error}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full!"
                onClick={() => {
                  setEditing(false);
                  setForm(stock_management);
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-full!"
                onClick={handleSave}
                disabled={loading}
              >
                {loading ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

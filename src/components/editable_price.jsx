import { useState, useEffect, useRef } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "./buttons";
import axios from "axios";

export const EditablePrice = ({ productId, pricing, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(pricing);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const modalRef = useRef(null);

  useEffect(() => {
    setForm(pricing);
  }, [pricing]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        setEditing(false);
        setForm(pricing);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [pricing]);

  const handlePricingChange = (field, value) => {
    setForm((prev) => {
      const updated = { ...prev, [field]: value };
      const cost =
        parseFloat(field === "cost_per_unit" ? value : updated.cost_per_unit) ||
        0;
      const markup =
        parseFloat(field === "markup_value" ? value : updated.markup_value) ||
        0;
      updated.selling_price = (cost + (cost * markup) / 100).toFixed(2);
      return updated;
    });
  };

  const handleClose = () => {
    setEditing(false);
    setForm(pricing);
    setError(null);
  };

  const handleSave = async () => {
    if (!form.cost_per_unit || !form.markup_value) {
      return setError("Cost per unit and markup are required.");
    }
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/products/${productId}/pricing`, {
        cost_per_unit: Number(form.cost_per_unit),
        markup_value: Number(form.markup_value),
        selling_price: Number(form.selling_price),
      });
      if (!data.success) throw new Error(data.message);
      onUpdate(form);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900 whitespace-nowrap">
          ₱ {Number(form.selling_price).toFixed(2)}
        </span>
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded-md hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
        >
          <Pencil size={12} />
        </button>
      </div>

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div
            ref={modalRef}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-xs mx-4 overflow-hidden"
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
              <div>
                <p className="text-sm font-bold text-gray-900">Edit Pricing</p>
                <p className="text-xs text-gray-400">Update cost and markup</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              {[
                { label: "Cost per Unit", field: "cost_per_unit", prefix: "₱" },
                { label: "Markup %", field: "markup_value", suffix: "%" },
              ].map(({ label, field, prefix, suffix }) => (
                <div key={field} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label} <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    {prefix && (
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {prefix}
                      </span>
                    )}
                    <input
                      type="number"
                      value={form[field]}
                      onChange={(e) =>
                        handlePricingChange(field, e.target.value)
                      }
                      className={`w-full ${prefix ? "pl-7" : "pl-3"} ${suffix ? "pr-8" : "pr-3"} py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all`}
                    />
                    {suffix && (
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                        {suffix}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              <div
                className={`rounded-xl p-4 border transition-all ${form.selling_price ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  Computed Selling Price
                </p>
                <p
                  className={`text-2xl font-bold ${form.selling_price ? "text-indigo-600" : "text-gray-300"}`}
                >
                  ₱ {form.selling_price || "0.00"}
                </p>
                {form.cost_per_unit && form.markup_value && (
                  <p className="text-xs text-indigo-400 mt-1">
                    ₱{form.cost_per_unit} + {form.markup_value}% markup
                  </p>
                )}
              </div>
              {error && (
                <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                  ⚠ {error}
                </p>
              )}
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex gap-2">
              <Button
                variant="secondary"
                size="md"
                className="w-full!"
                onClick={handleClose}
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

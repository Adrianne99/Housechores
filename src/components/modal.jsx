import { useState } from "react";
import {
  X,
  Package,
  BarChart3,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Check,
} from "lucide-react";
import { Button } from "./buttons";
import { INITIAL_FORM, UNITS, COLUMNS, CATEGORIES } from "../constants/modal";

const STEPS = [
  { id: 1, label: "Product", icon: Package },
  { id: 2, label: "Stock", icon: BarChart3 },
  { id: 3, label: "Pricing", icon: DollarSign },
];

const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && (
      <p className="text-xs text-red-500 flex items-center gap-1">⚠ {error}</p>
    )}
  </div>
);

const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300 bg-white"
  />
);

const validateStep = (step, form) => {
  const errors = {};
  if (step === 1) {
    if (!form.barcode) errors.barcode = "Required";
    if (!form.name) errors.name = "Required";
    if (!form.brand) errors.brand = "Required";
    if (!form.category) errors.category = "Select a category";
    if (!form.unit) errors.unit = "Select a unit";
  }
  if (step === 2) {
    if (form.stock_management.current_stock === "")
      errors.current_stock = "Required";
    if (form.stock_management.reorder_level === "")
      errors.reorder_level = "Required";
  }
  if (step === 3) {
    if (form.pricing.cost_per_unit === "") errors.cost_per_unit = "Required";
    if (form.pricing.markup_value === "") errors.markup_value = "Required";
  }
  return errors;
};

export const Add_Product_Modal = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!open) return null;

  const setField = (path, value) => {
    setForm((prev) => {
      const updated = { ...prev };
      if (path.includes(".")) {
        const [parent, child] = path.split(".");
        updated[parent] = { ...updated[parent], [child]: value };
      } else {
        updated[path] = value;
      }
      return updated;
    });
    setErrors((prev) => ({ ...prev, [path.split(".").pop()]: undefined }));
  };

  const handlePricingChange = (field, value) => {
    setForm((prev) => {
      const pricing = { ...prev.pricing, [field]: value };
      const cost =
        parseFloat(field === "cost_per_unit" ? value : pricing.cost_per_unit) ||
        0;
      const markup =
        parseFloat(field === "markup_value" ? value : pricing.markup_value) ||
        0;
      pricing.selling_price = (cost + (cost * markup) / 100).toFixed(2);
      return { ...prev, pricing };
    });
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const handleBack = () => {
    setErrors({});
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    const errs = validateStep(3, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/products/create-product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          stock_management: {
            ...form.stock_management,
            current_stock: Number(form.stock_management.current_stock),
            reorder_level: Number(form.stock_management.reorder_level),
          },
          pricing: {
            cost_per_unit: Number(form.pricing.cost_per_unit),
            markup_value: Number(form.pricing.markup_value),
            selling_price: Number(form.pricing.selling_price),
          },
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success)
        throw new Error(data.message || "Failed to add product");

      setForm(INITIAL_FORM);
      setErrors({});
      setStep(1);
      onSuccess?.();
      onClose();
    } catch (err) {
      setErrors({ submit: err.message });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setForm(INITIAL_FORM);
    setErrors({});
    setStep(1);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Add Product</h2>
              <p className="text-xs text-gray-400">
                Step {step} of {STEPS.length}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-2">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const isActive = step === s.id;
              const isComplete = step > s.id;
              return (
                <div key={s.id} className="flex items-center gap-2 flex-1">
                  <div
                    className={`flex items-center gap-2 flex-1 py-2 px-3 rounded-lg transition-all ${
                      isActive
                        ? "bg-indigo-50 border border-indigo-200"
                        : isComplete
                          ? "bg-green-50  border border-green-200"
                          : "bg-gray-50   border border-gray-200"
                    }`}
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        isActive
                          ? "bg-indigo-500 text-white"
                          : isComplete
                            ? "bg-green-500  text-white"
                            : "bg-gray-200   text-gray-400"
                      }`}
                    >
                      {isComplete ? <Check size={12} /> : <Icon size={12} />}
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        isActive
                          ? "text-indigo-600"
                          : isComplete
                            ? "text-green-600"
                            : "text-gray-400"
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={`w-4 h-px shrink-0 ${step > s.id ? "bg-green-300" : "bg-gray-200"}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="h-px bg-gray-100" />

        {/* Body */}
        <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
          {/* Step 1 — Product Info */}
          {step === 1 && (
            <>
              <Field label="Barcode" required error={errors.barcode}>
                <Input
                  placeholder="e.g. 4800016644801"
                  type="number"
                  value={form.barcode}
                  onChange={(e) => setField("barcode", e.target.value)}
                />
              </Field>

              <Field label="Product Name" required error={errors.name}>
                <Input
                  placeholder="e.g. Lucky Me Beef Noodles"
                  value={form.name}
                  onChange={(e) => setField("name", e.target.value)}
                />
              </Field>

              <Field label="Brand" required error={errors.brand}>
                <Input
                  placeholder="e.g. Monde Nissin"
                  value={form.brand}
                  onChange={(e) => setField("brand", e.target.value)}
                />
              </Field>

              <Field label="Category" required error={errors.category}>
                <div className="grid grid-cols-3 gap-2">
                  {CATEGORIES.map((category, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setField("category", category)}
                      className={`flex flex-col justify-center items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
                        form.category === category
                          ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                          : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
                      }`}
                    >
                      <span className="text-center leading-tight">
                        {category}
                      </span>
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Unit" required error={errors.unit}>
                <div className="flex flex-wrap gap-2">
                  {UNITS.map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setField("unit", u)}
                      className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        form.unit === u
                          ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                          : "border-gray-200 hover:border-gray-300 text-gray-600"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </Field>
            </>
          )}

          {/* Step 2 — Stock */}
          {step === 2 && (
            <>
              <Field
                label="Current Stock"
                required
                error={errors.current_stock}
              >
                <Input
                  type="number"
                  placeholder="0"
                  value={form.stock_management.current_stock}
                  onChange={(e) =>
                    setField("stock_management.current_stock", e.target.value)
                  }
                />
              </Field>

              <Field
                label="Reorder Level"
                required
                error={errors.reorder_level}
              >
                <Input
                  type="number"
                  placeholder="0"
                  value={form.stock_management.reorder_level}
                  onChange={(e) =>
                    setField("stock_management.reorder_level", e.target.value)
                  }
                />
                <p className="text-xs text-gray-400">
                  Alert triggers when stock falls below this number
                </p>
              </Field>

              <Field label="Supplier">
                <Input
                  placeholder="e.g. NutriAsia"
                  value={form.stock_management.supplier}
                  onChange={(e) =>
                    setField("stock_management.supplier", e.target.value)
                  }
                />
              </Field>
            </>
          )}

          {/* Step 3 — Pricing */}
          {step === 3 && (
            <>
              <Field
                label="Cost per Unit"
                required
                error={errors.cost_per_unit}
              >
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    ₱
                  </span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={form.pricing.cost_per_unit}
                    onChange={(e) =>
                      handlePricingChange("cost_per_unit", e.target.value)
                    }
                    className="w-full pl-7 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                  />
                </div>
              </Field>

              <Field label="Markup %" required error={errors.markup_value}>
                <div className="relative">
                  <input
                    type="number"
                    placeholder="0"
                    value={form.pricing.markup_value}
                    onChange={(e) =>
                      handlePricingChange("markup_value", e.target.value)
                    }
                    className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                    %
                  </span>
                </div>
              </Field>

              {/* Selling price preview */}
              <div
                className={`rounded-xl p-4 border transition-all ${
                  form.pricing.selling_price
                    ? "bg-indigo-50 border-indigo-200"
                    : "bg-gray-50 border-gray-200"
                }`}
              >
                <p className="text-xs text-gray-500 mb-1">
                  Computed Selling Price
                </p>
                <p
                  className={`text-2xl font-bold ${form.pricing.selling_price ? "text-indigo-600" : "text-gray-300"}`}
                >
                  ₱ {form.pricing.selling_price || "0.00"}
                </p>
                {form.pricing.cost_per_unit && form.pricing.markup_value && (
                  <p className="text-xs text-indigo-400 mt-1">
                    ₱{form.pricing.cost_per_unit} + {form.pricing.markup_value}%
                    markup
                  </p>
                )}
              </div>

              {errors.submit && (
                <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
                  ⚠ {errors.submit}
                </p>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="h-px bg-gray-100" />
        <div className="px-6 py-4 flex gap-2">
          {step > 1 ? (
            <Button
              variant="secondary"
              size="md"
              className="w-full! gap-2"
              onClick={handleBack}
            >
              <ChevronLeft size={16} /> Back
            </Button>
          ) : (
            <Button
              variant="secondary"
              size="md"
              className="w-full!"
              onClick={handleClose}
            >
              Cancel
            </Button>
          )}

          {step < STEPS.length ? (
            <Button
              variant="primary"
              size="md"
              className="w-full! gap-2"
              onClick={handleNext}
            >
              Next <ChevronRight size={16} />
            </Button>
          ) : (
            <Button
              variant="primary"
              size="md"
              className="w-full!"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? "Adding..." : "Add Product"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

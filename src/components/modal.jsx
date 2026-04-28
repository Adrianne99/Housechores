import { useState, useRef, memo, useCallback, useEffect } from "react";
import {
  X,
  Package,
  BarChart3,
  DollarSign,
  ChevronRight,
  ChevronLeft,
  Store,
  Check,
} from "lucide-react";
import { Button } from "./buttons";
import { UNITS, CATEGORIES, INITIAL_FORM } from "../constants/modal";
import axios from "axios";

const STEPS = [
  { id: 1, label: "Product", icon: Package },
  { id: 2, label: "Stock", icon: BarChart3 },
  { id: 3, label: "Pricing", icon: DollarSign },
];

// ── Shared primitives ──────────────────────────────────────────
export const Field = ({ label, error, required, children }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
      {label} {required && <span className="text-red-400">*</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">⚠ {error}</p>}
  </div>
);

export const Input = (props) => (
  <input
    {...props}
    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300 bg-white"
  />
);

// ── Memoized grids (prevents re-render on every keystroke) ─────
const CategoryGrid = memo(({ selected, onSelect }) => (
  <div className="grid grid-cols-3 gap-2">
    {CATEGORIES.map((category) => (
      <button
        key={category}
        type="button"
        onClick={() => onSelect(category)}
        className={`flex flex-col justify-center items-center gap-1 p-2 rounded-xl border text-xs font-medium transition-all ${
          selected === category
            ? "border-indigo-400 bg-indigo-50 text-indigo-600"
            : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-600"
        }`}
      >
        {category}
      </button>
    ))}
  </div>
));

const UnitGrid = memo(({ selected, onSelect }) => (
  <div className="flex flex-wrap gap-2">
    {UNITS.map((u) => (
      <button
        key={u}
        type="button"
        onClick={() => onSelect(u)}
        className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
          selected === u
            ? "border-indigo-400 bg-indigo-50 text-indigo-600"
            : "border-gray-200 hover:border-gray-300 text-gray-600"
        }`}
      >
        {u}
      </button>
    ))}
  </div>
));

const useBarcodeSearch = (barcode, setField) => {
  const [searching, setSearching] = useState(false);
  const [found, setFound] = useState(false);
  const [existingBranches, setExistingBranches] = useState([]);

  useEffect(() => {
    if (!barcode || barcode.length < 4) {
      setFound(false);
      setExistingBranches([]);
      return;
    }
    const timeout = setTimeout(async () => {
      setSearching(true);
      try {
        const { data } = await axios.get(`/api/products/barcode/${barcode}`);
        if (data.success && data.product) {
          setField("name", data.product.name);
          setField("brand", data.product.brand);
          setField("category", data.product.category);
          setField("unit", data.product.unit);
          setFound(true);
          setExistingBranches(data.existing_branches ?? []);
        } else {
          setFound(false);
          setExistingBranches([]);
        }
      } catch {
        setFound(false);
        setExistingBranches([]);
      } finally {
        setSearching(false);
      }
    }, 600);

    return () => clearTimeout(timeout);
  }, [barcode]);

  return { searching, found, existingBranches };
};

// ── Step indicators ────────────────────────────────────────────
const StepBar = memo(({ step }) => (
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
                  ? "bg-green-50 border border-green-200"
                  : "bg-gray-50 border border-gray-200"
            }`}
          >
            <div
              className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                isActive
                  ? "bg-indigo-500 text-white"
                  : isComplete
                    ? "bg-green-500 text-white"
                    : "bg-gray-200 text-gray-400"
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
));

// ── Validate ───────────────────────────────────────────────────
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

// ── Shared modal shell ─────────────────────────────────────────
const ModalShell = ({
  title,
  subtitle,
  step,
  onClose,
  onBack,
  onNext,
  nextLabel,
  loading,
  errors,
  children,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/30 backdrop-blur-sm"
      onClick={onClose}
    />
    <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{title}</h2>
            <p className="text-xs text-gray-400">{subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
          >
            <X size={18} />
          </button>
        </div>
        <StepBar step={step} />
      </div>

      <div className="h-px bg-gray-100" />

      {/* Body */}
      <div className="px-6 py-5 flex flex-col gap-4 max-h-[60vh] overflow-y-auto">
        {children}
        {errors?.submit && (
          <p className="text-xs text-red-500 text-center bg-red-50 py-2 px-3 rounded-lg">
            ⚠ {errors.submit}
          </p>
        )}
      </div>

      <div className="h-px bg-gray-100" />

      {/* Footer */}
      <div className="px-6 py-4 flex gap-2">
        {step > 1 ? (
          <Button
            variant="secondary"
            size="md"
            className="w-full! gap-2"
            onClick={onBack}
          >
            <ChevronLeft size={16} /> Back
          </Button>
        ) : (
          <Button
            variant="secondary"
            size="md"
            className="w-full!"
            onClick={onClose}
          >
            Cancel
          </Button>
        )}
        <Button
          variant="primary"
          size="md"
          className="w-full! gap-2"
          onClick={onNext}
          disabled={loading}
        >
          {loading ? "Saving..." : nextLabel}{" "}
          {!loading && step < STEPS.length && <ChevronRight size={16} />}
        </Button>
      </div>
    </div>
  </div>
);

// ── Step bodies (shared between Add and Edit) ──────────────────
const Step1 = ({
  form,
  errors,
  setField,
  selectedBranch,
  setSelectedBranch,
}) => {
  const { searching, found, existingBranches } = useBarcodeSearch(
    form.barcode,
    setField,
  );

  return (
    <>
      <BranchSelector
        selected={selectedBranch}
        onSelect={setSelectedBranch}
        error={errors.branch}
        existingBranches={existingBranches} // ← add this
      />

      <Field label="Barcode / Product Code" required error={errors.barcode}>
        <div className="relative">
          <Input
            placeholder="e.g. 4800016644801"
            value={form.barcode}
            onChange={(e) => setField("barcode", e.target.value)}
          />
          {searching && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2">
              <div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
          {!searching && found && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs text-green-600 font-medium">
              <Check size={13} className="text-green-500" />
              Auto-filled
            </div>
          )}
        </div>
        {found && (
          <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-lg">
            ✓ Product found.
          </p>
        )}
      </Field>

      {/* rest of fields unchanged */}
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
        <CategoryGrid
          selected={form.category}
          onSelect={(v) => setField("category", v)}
        />
      </Field>
      <Field label="Unit" required error={errors.unit}>
        <UnitGrid selected={form.unit} onSelect={(v) => setField("unit", v)} />
      </Field>
    </>
  );
};

const Step2 = ({ form, errors, setField }) => (
  <>
    <Field label="Current Stock" required error={errors.current_stock}>
      <Input
        type="number"
        placeholder="0"
        value={form.stock_management.current_stock}
        onChange={(e) =>
          setField("stock_management.current_stock", e.target.value)
        }
      />
    </Field>
    <Field label="Reorder Level" required error={errors.reorder_level}>
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
        onChange={(e) => setField("stock_management.supplier", e.target.value)}
      />
    </Field>
  </>
);

const Step3 = ({ form, errors, handlePricingChange, setField }) => (
  <>
    <Field label="Cost per Unit" required error={errors.cost_per_unit}>
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          ₱
        </span>
        <input
          type="number"
          placeholder="0.00"
          value={form.pricing.cost_per_unit}
          onChange={(e) => handlePricingChange("cost_per_unit", e.target.value)}
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
          onChange={(e) => handlePricingChange("markup_value", e.target.value)}
          className="w-full pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
          %
        </span>
      </div>
    </Field>
    <div
      className={`rounded-xl p-4 border transition-all ${form.pricing.selling_price ? "bg-indigo-50 border-indigo-200" : "bg-gray-50 border-gray-200"}`}
    >
      <p className="text-xs text-gray-500 mb-1">Computed Selling Price</p>
      <p
        className={`text-2xl font-bold ${form.pricing.selling_price ? "text-indigo-600" : "text-gray-300"}`}
      >
        ₱ {form.pricing.selling_price || "0.00"}
      </p>
      {form.pricing.cost_per_unit && form.pricing.markup_value && (
        <p className="text-xs text-indigo-400 mt-1">
          ₱{form.pricing.cost_per_unit} + {form.pricing.markup_value}% markup
        </p>
      )}
    </div>
  </>
);

// ── useFormState hook ──────────────────────────────────────────
const useFormState = (initial) => {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});

  const setField = useCallback((path, value) => {
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
  }, []);

  const handlePricingChange = useCallback((field, value) => {
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
  }, []);

  return { form, setForm, errors, setErrors, setField, handlePricingChange };
};

// ── Add Product Modal ──────────────────────────────────────────
export const Add_Product_Modal = ({ open, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const { form, setForm, errors, setErrors, setField, handlePricingChange } =
    useFormState(INITIAL_FORM);

  if (!open) return null;

  const handleNext = () => {
    if (step === 1 && !selectedBranch) {
      setErrors({ branch: "Please select a branch." });
      return;
    }

    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    step < STEPS.length ? setStep((s) => s + 1) : handleSubmit();
  };

  const handleSubmit = async () => {
    const errs = validateStep(3, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const { data } = await axios.post("/api/products/create-product", {
        ...form,
        branch: selectedBranch._id,
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
      });

      if (!data.success)
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
    setSelectedBranch(null);
    onClose();
  };

  return (
    <ModalShell
      title="Add Product"
      subtitle={`Step ${step} of ${STEPS.length}`}
      step={step}
      onClose={handleClose}
      onBack={() => {
        setErrors({});
        setStep((s) => s - 1);
      }}
      onNext={handleNext}
      nextLabel={step < STEPS.length ? "Next" : "Add Product"}
      loading={loading}
      errors={errors}
    >
      {step === 1 && (
        <Step1
          form={form}
          errors={errors}
          setField={setField}
          selectedBranch={selectedBranch}
          setSelectedBranch={setSelectedBranch}
        />
      )}
      {step === 2 && <Step2 form={form} errors={errors} setField={setField} />}
      {step === 3 && (
        <Step3
          form={form}
          errors={errors}
          handlePricingChange={handlePricingChange}
          setField={setField}
        />
      )}
    </ModalShell>
  );
};

// ── Edit Product Modal ─────────────────────────────────────────
export const Edit_Product_Modal = ({ open, onClose, onSuccess, products }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const toForm = (product) => ({
    barcode: product.barcode,
    name: product.name,
    brand: product.brand,
    category: product.category,
    unit: product.unit,
    stock_management: {
      current_stock: product.stock_management.current_stock,
      reorder_level: product.stock_management.reorder_level,
      supplier: product.stock_management.supplier ?? "",
    },
    pricing: {
      cost_per_unit: product.pricing.cost_per_unit,
      markup_value: product.pricing.markup_value,
      selling_price: product.pricing.selling_price,
    },
  });

  const { form, setForm, errors, setErrors, setField, handlePricingChange } =
    useFormState(products ? toForm(products) : INITIAL_FORM);

  if (!open || !products) return null;

  const handleNext = () => {
    const errs = validateStep(step, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setErrors({});
    step < STEPS.length ? setStep((s) => s + 1) : handleSubmit();
  };

  const handleSubmit = async () => {
    const errs = validateStep(3, form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${product._id}`, {
        method: "PUT",
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
        throw new Error(data.message || "Failed to update product");
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
    setErrors({});
    setStep(1);
    onClose();
  };

  return (
    <ModalShell
      title="Edit Product"
      subtitle={`Step ${step} of ${STEPS.length}`}
      step={step}
      onClose={handleClose}
      onBack={() => {
        setErrors({});
        setStep((s) => s - 1);
      }}
      onNext={handleNext}
      nextLabel={step < STEPS.length ? "Next" : "Save Changes"}
      loading={loading}
      errors={errors}
    >
      {step === 1 && <Step1 form={form} errors={errors} setField={setField} />}
      {step === 2 && <Step2 form={form} errors={errors} setField={setField} />}
      {step === 3 && (
        <Step3
          form={form}
          errors={errors}
          handlePricingChange={handlePricingChange}
          setField={setField}
        />
      )}
    </ModalShell>
  );
};

const BranchSelector = memo(
  ({ selected, onSelect, error, existingBranches = [] }) => {
    const [branches, setBranches] = useState([]);
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
      axios
        .get("/api/branches")
        .then(({ data }) => {
          if (data.success) setBranches(data.branches);
        })
        .catch(console.error);
    }, []);

    useEffect(() => {
      const handleClickOutside = (e) => {
        if (ref.current && !ref.current.contains(e.target)) setOpen(false);
      };
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // If selected branch is now in existingBranches, clear it
    useEffect(() => {
      if (selected && existingBranches.includes(selected._id)) {
        onSelect(null);
      }
    }, [existingBranches]);

    const availableBranches = branches.filter(
      (b) => !existingBranches.includes(b._id),
    );

    return (
      <Field label="Branch" required error={error}>
        <div className="relative" ref={ref}>
          <button
            type="button"
            onClick={() => setOpen((p) => !p)}
            className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border rounded-lg transition-all outline-none ${
              selected
                ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                : "border-gray-200 text-gray-400 hover:border-gray-300"
            }`}
          >
            <div className="flex items-center gap-2">
              <Store size={14} />
              <span>{selected ? selected.name : "Select a branch"}</span>
            </div>
            <ChevronRight
              size={14}
              className={`transition-transform ${open ? "rotate-90" : ""}`}
            />
          </button>

          {open && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
              <div className="max-h-40 overflow-y-auto py-1">
                {availableBranches.length === 0 ? (
                  <p className="text-xs text-gray-400 italic text-center py-4">
                    {existingBranches.length > 0
                      ? "This product exists in all branches"
                      : "No branches found"}
                  </p>
                ) : (
                  <>
                    {availableBranches.map((branch) => (
                      <button
                        key={branch._id}
                        type="button"
                        onClick={() => {
                          onSelect(branch);
                          setOpen(false);
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                          selected?._id === branch._id
                            ? "text-indigo-600 font-medium bg-indigo-50"
                            : "text-gray-700"
                        }`}
                      >
                        <div className="flex flex-col items-start">
                          <span>{branch.name}</span>
                          {branch.address && (
                            <span className="text-xs text-gray-400">
                              {branch.address}
                            </span>
                          )}
                        </div>
                        {selected?._id === branch._id && (
                          <Check size={13} className="text-indigo-500" />
                        )}
                      </button>
                    ))}

                    {/* Show disabled existing branches */}
                    {branches
                      .filter((b) => existingBranches.includes(b._id))
                      .map((branch) => (
                        <div
                          key={branch._id}
                          className="w-full flex items-center justify-between px-3 py-2 text-sm text-gray-300 cursor-not-allowed"
                        >
                          <div className="flex flex-col items-start">
                            <span>{branch.name}</span>
                            {branch.address && (
                              <span className="text-xs text-gray-200">
                                {branch.address}
                              </span>
                            )}
                          </div>
                          <span className="text-xs bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-md">
                            Already added
                          </span>
                        </div>
                      ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </Field>
    );
  },
);

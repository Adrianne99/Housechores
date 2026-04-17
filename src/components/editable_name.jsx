import { useState, useRef, useEffect } from "react";
import { Check, Pencil, X } from "lucide-react";

export const EditableName = ({ productId, name, brand, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name, brand });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setForm({ name: name ?? "", brand: brand ?? "" });
  }, [name, brand]);

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setForm({ name, brand });
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (form.name === name && form.brand === brand) {
      setEditing(false);
      return;
    }
    if (!form.name.trim()) {
      setError("Name is required");
      return;
    }
    if (!form.brand.trim()) {
      setError("Brand is required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/name`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, brand: form.brand }),
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

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSave();
    if (e.key === "Escape") handleCancel();
  };

  if (editing) {
    return (
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-1">
            <input
              ref={inputRef}
              value={form.name}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, name: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              placeholder="Product name"
              className="text-sm font-medium w-40 px-2 py-1 border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
            />
            <input
              value={form.brand}
              onChange={(e) =>
                setForm((prev) => ({ ...prev, brand: e.target.value }))
              }
              onKeyDown={handleKeyDown}
              placeholder="Brand"
              className="text-xs w-40 px-2 py-1 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white text-gray-500"
            />
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={handleSave}
              disabled={loading}
              className="p-1 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white transition-colors disabled:opacity-50"
            >
              {loading ? (
                <div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check size={12} />
              )}
            </button>
            <button
              onClick={handleCancel}
              className="p-1 rounded-md hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X size={12} />
            </button>
          </div>
        </div>
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={handleEdit}
      className="group flex items-center gap-0 w-fit text-left hover:gap-1.5 transition-all duration-200"
    >
      <div className="flex flex-col">
        <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
          {form.name}
        </span>
        <span className="text-xs text-gray-400">{form.brand}</span>
      </div>
      <Pencil
        size={11}
        className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-200 text-indigo-400 self-start mt-0.5"
      />
    </button>
  );
};

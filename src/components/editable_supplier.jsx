import { useState, useEffect, useRef } from "react";
import { Check, Pencil, X } from "lucide-react";

export const EditableSupplier = ({ productId, supplier, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(supplier ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    setValue(supplier ?? "");
  }, [supplier]);

  const handleEdit = () => {
    setEditing(true);
    setError(null);
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  const handleCancel = () => {
    setValue(supplier ?? "");
    setEditing(false);
    setError(null);
  };

  const handleSave = async () => {
    if (value === supplier) {
      setEditing(false);
      return;
    }
    if (!value.trim()) {
      setError("Required");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/supplier`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ supplier: value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      onUpdate(value);
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
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-1">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setError(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. NutriAsia"
            className="text-sm w-36 px-2 py-1 border border-indigo-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 bg-white placeholder:text-gray-300"
          />
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
        {error && <p className="text-xs text-red-500">⚠ {error}</p>}
      </div>
    );
  }

  return (
    <button
      onClick={handleEdit}
      className="group flex items-center gap-0 w-fit text-sm text-gray-600 hover:text-indigo-600 transition-all duration-200 hover:gap-1.5"
    >
      {value || (
        <span className="text-gray-300 italic text-xs">No supplier</span>
      )}
      <Pencil
        size={10}
        className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-200"
      />
    </button>
  );
};

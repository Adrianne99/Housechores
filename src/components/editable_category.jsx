import { CATEGORIES } from "../constants/modal";
import {
  ArrowLeftRight,
  Pencil,
  Trash2,
  TrendingUp,
  Check,
  X,
} from "lucide-react"; // Added for visual flair
import { useState, useEffect, useRef } from "react";

export const EditableCategory = ({ productId, category, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(category);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setEditing(false);
        setSelected(category); // reset on outside click
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [category]);

  const handleSave = async (value) => {
    if (value === category) {
      setEditing(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/category`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: value }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setSelected(value);
      onUpdate(value);
      setEditing(false);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-fit" ref={dropdownRef}>
      {/* Trigger */}
      <button
        onClick={() => setEditing((prev) => !prev)}
        className="group flex items-center gap-0 w-fit px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-600 transition-all duration-200 hover:gap-1.5 hover:pr-2 hover:bg-indigo-100"
      >
        {loading ? (
          <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin mr-1" />
        ) : (
          selected
        )}
        <Pencil
          size={10}
          className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-200"
        />
      </button>

      {/* Dropdown */}
      {editing && (
        <div className="absolute top-full left-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
              Select Category
            </p>
          </div>
          <div className="max-h-56 overflow-y-auto py-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => handleSave(cat)}
                className={`w-full flex items-center justify-between px-3 py-2 text-sm transition-colors hover:bg-gray-50 ${
                  selected === cat
                    ? "text-indigo-600 font-medium bg-indigo-50"
                    : "text-gray-700"
                }`}
              >
                {cat}
                {selected === cat && (
                  <Check size={13} className="text-indigo-500" />
                )}
              </button>
            ))}
          </div>
          {error && (
            <div className="px-3 py-2 border-t border-gray-100">
              <p className="text-xs text-red-500">⚠ {error}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

import { CATEGORIES } from "../constants/modal";
import { Pencil, Check } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

export const EditableCategory = ({ productId, category, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState(category);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    setSelected(category);
  }, [category]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target)
      ) {
        setEditing(false);
        setSelected(category);
        setError(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [category]);

  const handleOpen = () => {
    const rect = triggerRef.current.getBoundingClientRect();
    setPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
    });
    setEditing((prev) => !prev);
  };

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
    <>
      <button
        ref={triggerRef}
        onClick={handleOpen}
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

      {editing &&
        createPortal(
          <div
            ref={dropdownRef}
            style={{ top: position.top, left: position.left }}
            className="fixed w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-9999 overflow-hidden"
          >
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
          </div>,
          document.body,
        )}
    </>
  );
};

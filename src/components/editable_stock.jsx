import { useRef, useEffect, useState } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "./buttons";
import { CommentField } from "./comment_field";
import { useEditComment } from "../hooks/use_edit_comment";
import axios from "axios";

export const EditableStock = ({ productId, stock_management, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(stock_management);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const latestStock = useRef(stock_management);
  const { comment, setComment, resetComment } = useEditComment();
  const modalRef = useRef(null);

  useEffect(() => {
    latestStock.current = stock_management;
    setForm(stock_management);
  }, [stock_management]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target))
        handleClose();
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleClose = () => {
    setEditing(false);
    setForm(latestStock.current);
    setError(null);
    resetComment();
  };

  const handleSave = async () => {
    if (form.current_stock === "" || form.reorder_level === "") {
      return setError("Current stock and reorder level are required.");
    }
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/products/${productId}/stock`, {
        current_stock: Number(form.current_stock),
        reorder_level: Number(form.reorder_level),
        supplier: form.supplier,
        comment,
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

  const fields = [
    { label: "Current Stock", key: "current_stock", required: true },
    {
      label: "Reorder Level",
      key: "reorder_level",
      required: true,
      hint: "Alert triggers when stock falls below this number",
    },
    { label: "Supplier", key: "supplier", placeholder: "e.g. NutriAsia" },
  ];

  return (
    <>
      <div className="flex items-center gap-2">
        {form.current_stock}
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
                <p className="text-sm font-bold text-gray-900">Edit Stock</p>
                <p className="text-xs text-gray-400">
                  Update stock management details
                </p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              {fields.map(({ label, key, required, hint, placeholder }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label}{" "}
                    {required && <span className="text-red-400">*</span>}
                  </label>
                  <input
                    type={key === "supplier" ? "text" : "number"}
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                  />
                  {hint && <p className="text-xs text-gray-400">{hint}</p>}
                </div>
              ))}
              <CommentField value={comment} onChange={setComment} />
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

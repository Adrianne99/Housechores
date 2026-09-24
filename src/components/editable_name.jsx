import { useState, useRef } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "./buttons";
import { useEditComment } from "../hooks/use_edit_comment";
import { CommentField } from "./comment_field";
import axios from "axios";

export const EditableName = ({ productId, name, brand, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: name ?? "", brand: brand ?? "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { comment, setComment, resetComment } = useEditComment();
  const modalRef = useRef(null);



  // Fill the form from the current values each time the editor opens
  // (instead of syncing props into state with an effect).
  const open = () => {
    setForm({ name: name ?? "", brand: brand ?? "" });
    setEditing(true);
  };

  const handleClose = () => {
    setEditing(false);
    setForm({ name: name ?? "", brand: brand ?? "" });
    setError(null);
    resetComment();
  };

  const handleSave = async () => {
    if (!form.name.trim()) return setError("Name is required");
    if (!form.brand.trim()) return setError("Brand is required");
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/products/${productId}/name`, {
        name: form.name,
        brand: form.brand,
        comment,
      });
      if (!data.success) throw new Error(data.message);
      onUpdate(form);
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={open}
        className="group flex items-center gap-0 w-fit text-left hover:gap-1.5 transition-all duration-200"
      >
        <div className="flex flex-col">
          <span className="text-sm font-medium text-gray-900 group-hover:text-indigo-600 transition-colors whitespace-nowrap">
            {name}
          </span>
          <span className="text-xs text-gray-400">{brand}</span>
        </div>
        <Pencil
          size={11}
          className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-200 text-indigo-400 self-start mt-0.5"
        />
      </button>

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
                <p className="text-sm font-bold text-gray-900">
                  Edit Product Name
                </p>
                <p className="text-xs text-gray-400">Update name and brand</p>
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
                {
                  label: "Product Name",
                  key: "name",
                  placeholder: "e.g. Lucky Me Beef Noodles",
                  autoFocus: true,
                },
                {
                  label: "Brand",
                  key: "brand",
                  placeholder: "e.g. Monde Nissin",
                },
              ].map(({ label, key, placeholder, autoFocus }) => (
                <div key={key} className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                    {label} <span className="text-red-400">*</span>
                  </label>
                  <input
                    autoFocus={autoFocus}
                    type="text"
                    value={form[key]}
                    placeholder={placeholder}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, [key]: e.target.value }))
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                  />
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
                className="w-full"
                onClick={handleClose}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                className="w-full"
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

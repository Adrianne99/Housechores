import { useRef, useState, useEffect } from "react";
import { Pencil, X } from "lucide-react";
import { Button } from "./buttons";
import { useEditComment } from "../hooks/use_edit_comment";
import { CommentField } from "./comment_field";
import axios from "axios";

export const EditableBarcode = ({ productId, barcode, onUpdate }) => {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(barcode ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { comment, setComment, resetComment } = useEditComment();
  const modalRef = useRef(null);

  useEffect(() => {
    setValue(barcode ?? "");
  }, [barcode]);

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
    setValue(barcode ?? "");
    setError(null);
    resetComment();
  };

  const handleSave = async () => {
    if (value === barcode) return setEditing(false);
    if (!value.trim()) return setError("Barcode is required");
    setLoading(true);
    try {
      const { data } = await axios.patch(`/api/products/${productId}/barcode`, {
        barcode: value,
        comment,
      });
      if (!data.success) throw new Error(data.message);
      onUpdate(value);
      handleClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setEditing(true)}
        className="group flex items-center gap-0 w-fit font-mono text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg transition-all duration-200 hover:bg-indigo-50 hover:text-indigo-600 hover:gap-1.5 hover:pr-2"
      >
        {value}
        <Pencil
          size={10}
          className="w-0 overflow-hidden opacity-0 group-hover:w-3 group-hover:opacity-100 transition-all duration-200"
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
                <p className="text-sm font-bold text-gray-900">Edit Barcode</p>
                <p className="text-xs text-gray-400">Update product barcode</p>
              </div>
              <button
                onClick={handleClose}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-5 py-4 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                  Barcode <span className="text-red-400">*</span>
                </label>
                <input
                  autoFocus
                  type="text"
                  value={value}
                  placeholder="e.g. 4800016644801"
                  onChange={(e) => {
                    setValue(e.target.value);
                    setError(null);
                  }}
                  className="w-full font-mono px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all placeholder:text-gray-300"
                />
              </div>
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

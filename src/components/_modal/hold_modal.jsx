import { useEffect, useRef, useState } from "react";
import { Pause, X } from "lucide-react";
import { Button } from "../buttons";

// Body mounts only while open, so every opening starts with a fresh form.
export const HoldModal = (props) =>
  props.open ? <HoldModalBody {...props} /> : null;

const HoldModalBody = ({ onClose, onConfirm, loading }) => {
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const inputRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 50);
    return () => clearTimeout(t);
  }, []);

  const handleSubmit = () => {
    onConfirm({ customer_name: name, note });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Pause size={18} className="text-orange-600" />
            </div>
            <p className="text-base font-bold text-gray-900">Hold cart</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Customer name (optional)
            </label>
            <input
              ref={inputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Maria"
              onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. went to get cash"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <p className="text-xs text-gray-400">
            Cart will be cleared. You can resume it from the Held Orders panel.
          </p>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Holding..." : "Hold"}
          </Button>
        </div>
      </div>
    </div>
  );
};

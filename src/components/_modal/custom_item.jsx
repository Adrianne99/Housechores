import { useRef, useState } from "react";
import { PackagePlus, X } from "lucide-react";
import { Button } from "../buttons";

// Body mounts only while open, so every opening starts with a fresh form.
export const CustomItemModal = (props) =>
  props.open ? <CustomItemModalBody {...props} /> : null;

const CustomItemModalBody = ({ onClose, onAdd }) => {
  const [name, setName] = useState("");
  const [unit_price, setUnitPrice] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("");
  const [error, setError] = useState(null);
  const inputRef = useRef(null);


  const handleAdd = () => {
    if (!name.trim()) return setError("Name is required.");
    const price = Number(unit_price);
    if (!Number.isFinite(price) || price <= 0)
      return setError("Enter a valid price.");
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0)
      return setError("Enter a valid quantity.");

    onAdd({ name, unit_price: price, quantity: qty, unit });
    onClose();
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
            <div className="p-2 bg-indigo-100 rounded-xl">
              <PackagePlus size={18} className="text-indigo-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                Add custom item
              </p>
              <p className="text-xs text-gray-400">
                For items without a barcode
              </p>
            </div>
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
              Name
            </label>
            <input
              ref={inputRef}
            autoFocus
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Bananas"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Price (₱)
              </label>
              <input
                type="number"
                value={unit_price}
                onChange={(e) => {
                  setUnitPrice(e.target.value);
                  setError(null);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Quantity
              </label>
              <input
                type="number"
                value={quantity}
                onChange={(e) => {
                  setQuantity(e.target.value);
                  setError(null);
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Unit (optional)
            </label>
            <input
              type="text"
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. kg, pcs"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={handleAdd}
          >
            Add
          </Button>
        </div>
      </div>
    </div>
  );
};

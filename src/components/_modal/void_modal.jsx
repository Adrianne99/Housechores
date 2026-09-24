import { useState } from "react";
import { XCircle, X } from "lucide-react";
import axios from "axios";
import { Button } from "../buttons";

// Body mounts only while open, so each void starts with an empty form.
export const VoidModal = (props) =>
  props.open && props.order ? <VoidModalBody {...props} /> : null;

const VoidModalBody = ({ onClose, order, onSuccess }) => {
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);



  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Please provide a reason.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { data } = await axios.patch(
        `/api/orders/${order._id}/void`,
        { reason: reason.trim() },
      );
      if (!data.success) throw new Error(data.message);
      onSuccess?.(data.order);
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={loading ? undefined : onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-xl">
              <XCircle size={18} className="text-red-600" />
            </div>
            <p className="text-base font-bold text-gray-900">Void order</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-3">
          <div className="bg-gray-50 rounded-xl px-3 py-2">
            <p className="text-xs text-gray-400">Order</p>
            <p className="text-sm font-medium text-gray-900">
              {order.order_number}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              Total: ₱{order.total.toFixed(2)}
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Reason
            </label>
            <textarea
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Customer changed their mind"
              rows={3}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 resize-none"
            />
          </div>

          <p className="text-xs text-gray-400">
            Voiding restores stock and marks the order as voided. This cannot be
            undone.
          </p>

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
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Voiding..." : "Void order"}
          </Button>
        </div>
      </div>
    </div>
  );
};

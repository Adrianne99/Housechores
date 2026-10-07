import { useState } from "react";
import { useHeldOrders, drop_held } from "../../hooks/use_held_orders";
import { error_message } from "../../lib/query";
import { X, Pause, Trash2, ArrowRight, Clock } from "lucide-react";
import axios from "axios";

export const HeldOrdersPanel = ({ open, onClose, onResume }) => {
  // Same cached list as the POS badge — refreshed whenever a cart is held.
  const { data: held = [], isPending: loading, error: load_error } = useHeldOrders();
  const [actionError, setError] = useState(null);
  const error = actionError ?? error_message(load_error);

  const handleResume = async (id) => {
    try {
      const { data } = await axios.get(`/api/held-orders/${id}`);
      if (!data.success) throw new Error(data.message);
      // onResume returns false if the cashier chose to keep their cart
      if (onResume(data.held_order, id) !== false) onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Discard this held order?")) return;
    try {
      const { data } = await axios.delete(
        `/api/held-orders/${id}`,
      );
      if (!data.success) throw new Error(data.message);
      drop_held(id);
    } catch (err) {
      setError(err.response?.data?.message || err.message);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 backdrop-blur-sm transition-opacity ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-white shadow-2xl transform transition-transform duration-300 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-xl">
              <Pause size={18} className="text-orange-600" />
            </div>
            <div>
              <p className="text-base font-bold text-gray-900">
                Held Orders ({held.length})
              </p>
              <p className="text-xs text-gray-400">
                Parked carts waiting to be resumed
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

        {/* Body */}
        <div className="overflow-y-auto h-[calc(100%-72px)] p-6 space-y-3">
          {error && (
            <p className="text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              ⚠ {error}
            </p>
          )}

          {loading ? (
            <p className="text-center text-sm text-gray-400 py-8">Loading...</p>
          ) : held.length === 0 ? (
            <div className="text-center py-12">
              <Pause size={32} className="mx-auto text-gray-300 mb-2" />
              <p className="text-sm text-gray-400">No held orders</p>
              <p className="text-xs text-gray-300 mt-1">
                Hold a cart to park it here
              </p>
            </div>
          ) : (
            held.map((h) => {
              // A weighed line counts as one item.
              const itemCount = h.items.reduce((sum, i) => sum + (Number.isInteger(i.quantity) ? i.quantity : 1), 0);
              const total =
                h.items.reduce((sum, i) => sum + Math.round(i.unit_price * i.quantity * 100), 0) / 100;
              const heldAgo = Math.floor(
                (Date.now() - new Date(h.createdAt)) / 60000,
              );

              return (
                <div
                  key={h._id}
                  className="bg-gray-50 hover:bg-gray-100 rounded-xl p-4 transition-colors"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {h.customer_name || "Unnamed customer"}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-gray-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Clock size={11} />
                          {heldAgo < 1
                            ? "Just now"
                            : heldAgo < 60
                              ? `${heldAgo}m ago`
                              : `${Math.floor(heldAgo / 60)}h ago`}
                        </span>
                        <span>by {h.cashier?.name ?? "?"}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(h._id)}
                      className="p-1 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>

                  <div className="text-xs text-gray-500 mb-3 line-clamp-2">
                    {h.items
                      .map((i) => `${i.quantity}× ${i.product_snapshot?.name}`)
                      .join(", ")}
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                    <p className="text-xs text-gray-500">
                      {itemCount} item{itemCount !== 1 ? "s" : ""} · ₱
                      {total.toFixed(2)}
                    </p>
                    <button
                      onClick={() => handleResume(h._id)}
                      className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      Resume
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
};

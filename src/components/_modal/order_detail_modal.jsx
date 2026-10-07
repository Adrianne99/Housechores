import { X, User, Store, Clock, XCircle, RotateCcw } from "lucide-react";
import { Button } from "../buttons";
import { StatusBadge } from "../badge";
import { qty_label, round_qty } from "../../utils/format";

export const OrderDetailModal = ({ open, onClose, order, canVoid, onVoid, onRefund }) => {
  if (!open || !order) return null;

  const formattedDate = new Date(order.createdAt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <p className="text-base font-bold text-gray-900">
                {order.order_number}
              </p>
              <StatusBadge status={order.status} />
            </div>
            <p className="text-xs text-gray-400">{formattedDate}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 overflow-y-auto flex-1 space-y-4">
          {/* Meta */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <Store size={11} /> Branch
              </p>
              <p className="text-gray-900 font-medium mt-0.5">
                {order.branch?.name ?? "—"}
              </p>
            </div>
            <div className="bg-gray-50 rounded-lg px-3 py-2">
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <User size={11} /> Cashier
              </p>
              <p className="text-gray-900 font-medium mt-0.5">
                {order.cashier?.name ?? "—"}
              </p>
            </div>
          </div>

          {/* Voided info */}
          {order.status === "voided" && (
            <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-3">
              <div className="flex items-start gap-2">
                <XCircle size={16} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-red-700">
                    Voided by {order.voided_by?.name ?? "—"}
                  </p>
                  {order.voided_at && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(order.voided_at).toLocaleString("en-PH")}
                    </p>
                  )}
                  {order.void_reason && (
                    <p className="text-xs text-red-600 mt-1">
                      "{order.void_reason}"
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="space-y-1">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Items
            </p>
            <div className="border border-gray-100 rounded-xl overflow-hidden">
              {order.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-start px-3 py-2 border-b border-gray-50 last:border-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-gray-900 truncate flex items-center gap-1">
                      {item.product_snapshot?.name}
                      {item.is_custom && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-normal">
                          custom
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      {qty_label(item)} × ₱{item.unit_price.toFixed(2)}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-gray-900 tabular-nums shrink-0 ml-2">
                    ₱{item.subtotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-1 text-sm pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">₱{order.subtotal.toFixed(2)}</span>
            </div>

            {order.discount_amount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>
                  Discount ({order.discount?.type ?? "manual"}
                  {order.discount?.id_number ? ` · ${order.discount.id_number}` : ""})
                  {order.discount?.approved_by_name && (
                    <span className="block text-[11px] text-gray-400">
                      approved by {order.discount.approved_by_name}
                    </span>
                  )}
                </span>
                <span className="tabular-nums">
                  -₱{order.discount_amount.toFixed(2)}
                </span>
              </div>
            )}

            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>Total</span>
              <span className="tabular-nums">₱{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                VAT (12%
                {order.vat_exempt ? ", exempt" : ", included"})
              </span>
              <span className="tabular-nums">
                ₱{order.vat_amount.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Refunds */}
          {order.refunds?.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Refunds · ₱{order.refunded_amount.toFixed(2)}
              </p>
              {order.refunds.map((r) => (
                <div key={r._id} className="bg-orange-50 border border-orange-100 rounded-xl px-3 py-2 text-xs">
                  <div className="flex justify-between font-semibold text-orange-800">
                    <span>{new Date(r.at).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short" })}</span>
                    <span>−₱{r.amount.toFixed(2)} ({r.method})</span>
                  </div>
                  <p className="text-orange-700 mt-0.5">
                    {r.items.map((i) => `${round_qty(i.quantity)}× ${i.name}${i.restocked ? "" : " (not restocked)"}`).join(", ")}
                  </p>
                  <p className="text-orange-600 mt-0.5">
                    "{r.reason}" · by {r.by_name}
                    {r.approved_by_name && r.approved_by_name !== r.by_name ? `, approved by ${r.approved_by_name}` : ""}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Payment */}
          <div className="space-y-1 text-sm pt-2 border-t border-gray-100">
            <div className="flex justify-between text-gray-500">
              <span>Payment ({order.payment.method})</span>
              <span className="tabular-nums">
                ₱{order.payment.amount_tendered?.toFixed(2) ?? "—"}
              </span>
            </div>
            {order.payment.change > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>Change</span>
                <span className="tabular-nums">
                  ₱{order.payment.change.toFixed(2)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={onClose}
          >
            Close
          </Button>
          {onRefund && ["completed", "partially_refunded"].includes(order.status) && (
            <Button variant="secondary" size="md" className="w-full" onClick={() => onRefund(order)}>
              <RotateCcw size={14} />
              Refund
            </Button>
          )}
          {canVoid && order.status === "completed" && (
            <Button
              variant="danger"
              size="md"
              className="w-full"
              onClick={() => onVoid(order)}
            >
              <XCircle size={14} />
              Void
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

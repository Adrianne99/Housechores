import { CheckCircle2, Receipt, Printer } from "lucide-react";
import { Button } from "../buttons";

export const ReceiptOverlay = ({ open, order, onNewSale }) => {
  if (!open || !order) return null;

  const handlePrint = () => window.print();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:bg-white">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm print:hidden" />

      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col print:shadow-none print:max-w-full print:rounded-none">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center border-b border-gray-100">
          <div className="p-3 bg-green-100 rounded-full mb-3 print:hidden">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Sale Complete</h2>
          <p className="text-xs text-gray-400 mt-1">{order.order_number}</p>
        </div>

        {/* Receipt body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          {/* Meta */}
          <div className="text-xs text-gray-400 space-y-0.5 text-center">
            <p>
              {order.branch?.name ?? "Branch"} ·{" "}
              {new Date(order.createdAt).toLocaleString("en-PH")}
            </p>
            <p>Cashier: {order.cashier?.name}</p>
          </div>

          <div className="h-px bg-dashed border-t border-dashed border-gray-200" />

          {/* Items */}
          <div className="space-y-2">
            {order.items.map((item, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <div className="flex-1 min-w-0">
                  <p className="text-gray-900 truncate">
                    {item.product_snapshot.name}
                  </p>
                  <p className="text-xs text-gray-400">
                    {item.quantity} × ₱{item.unit_price.toFixed(2)}
                  </p>
                </div>
                <p className="font-medium text-gray-900 tabular-nums shrink-0 ml-2">
                  ₱{item.subtotal.toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="h-px bg-dashed border-t border-dashed border-gray-200" />

          {/* Totals */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <span className="tabular-nums">₱{order.subtotal.toFixed(2)}</span>
            </div>
            {order.discount_amount > 0 && (
              <div className="flex justify-between text-gray-500">
                <span>
                  {order.discount?.type === "senior"
                    ? "Senior citizen discount"
                    : order.discount?.type === "pwd"
                      ? "PWD discount"
                      : "Discount"}
                </span>
                <span className="tabular-nums">
                  -₱{order.discount_amount.toFixed(2)}
                </span>
              </div>
            )}
            <div className="flex justify-between font-bold text-gray-900 text-base pt-1">
              <span>TOTAL</span>
              <span className="tabular-nums">₱{order.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-gray-400">
              <span>
                {order.vat_exempt ? "VAT-exempt sale" : "VAT (12%, included)"}
              </span>
              <span className="tabular-nums">
                ₱{order.vat_amount.toFixed(2)}
              </span>
            </div>
            {order.discount?.id_number && (
              <div className="flex justify-between text-xs text-gray-400">
                <span>
                  {order.discount.type === "pwd" ? "PWD" : "Senior"} ID no.
                </span>
                <span>{order.discount.id_number}</span>
              </div>
            )}
          </div>

          <div className="h-px bg-dashed border-t border-dashed border-gray-200" />

          {/* Payment */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Cash tendered</span>
              <span className="tabular-nums">
                ₱{order.payment.amount_tendered.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between font-medium text-green-600">
              <span>Change</span>
              <span className="tabular-nums">
                ₱{order.payment.change.toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-center text-xs text-gray-400 pt-2">
            Thank you for your purchase!
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-2 print:hidden">
          <Button
            variant="secondary"
            size="md"
            className="w-full"
            onClick={handlePrint}
          >
            <Printer size={16} />
            Print
          </Button>
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={onNewSale}
          >
            <Receipt size={16} />
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
};

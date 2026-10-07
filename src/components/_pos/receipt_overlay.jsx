import { CheckCircle2, CloudOff, Receipt, Printer } from "lucide-react";
import { Button } from "../buttons";
import { useStoreSettings } from "../../hooks/use_settings";
import { print_receipt, receipt_lines } from "../../utils/receipt_print";
import { qty_label } from "../../utils/format";

const money = (n) => `₱${Number(n ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const Row = ({ label, value, className = "" }) => (
  <div className={`flex justify-between gap-3 ${className}`}>
    <span>{label}</span>
    <span className="tabular-nums shrink-0">{value}</span>
  </div>
);

export const ReceiptOverlay = ({ open, order, onNewSale }) => {
  const settings = useStoreSettings();
  if (!open || !order) return null;
  const r = receipt_lines(order, settings);
  const p = order.payment ?? {};

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div role="dialog" aria-modal="true" aria-label="Receipt" className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="px-6 pt-6 pb-4 flex flex-col items-center text-center border-b border-gray-100">
          <div className={`p-3 rounded-full mb-3 ${order.offline ? "bg-amber-100" : "bg-green-100"}`}>
            {order.offline ? <CloudOff size={32} className="text-amber-600" /> : <CheckCircle2 size={32} className="text-green-600" />}
          </div>
          <h2 className="text-xl font-bold text-gray-900">{order.offline ? "Sale saved offline" : "Sale Complete"}</h2>
          <p className="text-xs text-gray-400 mt-1">
            {order.offline ? "It will be sent to the server when the internet is back." : order.order_number}
          </p>
        </div>

        {/* Receipt preview (what prints on the thermal roll) */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="mx-auto max-w-[300px] font-mono text-[12px] leading-snug text-gray-800 space-y-2">
            <div className="text-center">
              {r.logo && <img src={r.logo} alt="" className="mx-auto max-h-12 mb-1" />}
              <p className="font-bold text-sm">{r.store}</p>
              {r.branch && <p>{r.branch}</p>}
              {r.address && <p>{r.address}</p>}
              {r.phone && <p>{r.phone}</p>}
              {r.tin && <p>{r.tin}</p>}
            </div>
            <div className="border-t border-dashed border-gray-300" />
            <Row label="No." value={order.order_number} />
            <Row label="Date" value={new Date(order.offline_sold_at ?? order.createdAt).toLocaleString("en-PH")} />
            <Row label="Cashier" value={order.cashier?.name} />
            <div className="border-t border-dashed border-gray-300" />
            {order.items.map((item, idx) => (
              <div key={idx}>
                <p className="truncate">{item.product_snapshot?.name}</p>
                <Row label={`  ${qty_label(item)} × ${money(item.unit_price)}`} value={money(item.subtotal)} className="pl-3 text-gray-500" />
              </div>
            ))}
            <div className="border-t border-dashed border-gray-300" />
            <Row label="Subtotal" value={money(order.subtotal)} />
            {order.discount_amount > 0 && (
              <Row
                label={order.discount?.type === "senior" ? "Senior citizen discount" : order.discount?.type === "pwd" ? "PWD discount" : "Discount"}
                value={`-${money(order.discount_amount)}`}
              />
            )}
            <Row label="TOTAL" value={money(order.total)} className="font-bold text-sm" />
            {r.vat_rows.map(([l, v]) => (
              <Row key={l} label={l} value={money(v)} className="text-gray-500" />
            ))}
            {order.discount?.id_number && <Row label={order.discount.type === "pwd" ? "PWD ID" : "SC ID"} value={order.discount.id_number} />}
            <div className="border-t border-dashed border-gray-300" />
            <Row label="Paid by" value={r.method} />
            {p.method === "cash" && (
              <>
                <Row label="Cash" value={money(p.amount_tendered)} />
                <Row label="Change" value={money(p.change)} className="font-bold text-green-700" />
              </>
            )}
            {p.reference && <Row label="Ref" value={p.reference} />}
            <div className="border-t border-dashed border-gray-300" />
            <p className="text-center">{r.footer}</p>
            <p className="text-center text-[10px] text-gray-400">THIS IS NOT AN OFFICIAL RECEIPT</p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-100 flex gap-2">
          <Button variant="secondary" size="md" className="w-full" onClick={() => print_receipt(order, settings)}>
            <Printer size={16} />
            Print
          </Button>
          <Button variant="primary" size="md" className="w-full" onClick={onNewSale} autoFocus>
            <Receipt size={16} />
            New Sale
          </Button>
        </div>
      </div>
    </div>
  );
};

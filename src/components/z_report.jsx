import { useQuery } from "@tanstack/react-query";
import { get, error_message } from "../lib/query";
import { Printer, X } from "lucide-react";
import { date_of, method_label, peso, time_of } from "../utils/format";
import { z_label } from "../utils/cash";


const Row = ({ label, value, strong, tone }) => (
  <div className={`flex justify-between py-1 text-sm ${tone ?? "text-gray-600"}`}>
    <span>{label}</span>
    <span className={`tabular-nums ${strong ? "font-bold text-gray-900" : ""}`}>{value}</span>
  </div>
);

export const OverShort = ({ value }) => {
  if (value === undefined || value === null) return <span className="text-gray-400">—</span>;
  if (value === 0)
    return <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700">Balanced</span>;
  return (
    <span
      className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
        value > 0 ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-600"
      }`}
    >
      {value > 0 ? `Over ${peso(value)}` : `Short ${peso(-value)}`}
    </span>
  );
};

// Printable Z-reading (closed drawer) or X-reading (still open) for one drawer.
export const ZReportModal = ({ sessionId, onClose }) => {
  const q = useQuery({
    queryKey: ["drawer", "detail", sessionId],
    queryFn: () => get(`/api/drawer/${sessionId}`),
  });
  const data = q.data;
  const error = error_message(q.error);


  const s = data?.session;
  const z = data?.summary;
  const closed = s?.status === "closed";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center print:static print:block">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm print:hidden" onClick={onClose} />
      <div
        role="dialog"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        aria-modal="true"
        aria-label="Z-reading"
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 max-h-[92vh] overflow-y-auto print:shadow-none print:max-h-none print:mx-0"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 print:hidden">
          <p className="text-base font-bold text-gray-900">{closed ? "Z-reading" : "X-reading (drawer still open)"}</p>
          <div className="flex gap-1">
            <button type="button" onClick={() => window.print()} aria-label="Print" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <Printer size={18} />
            </button>
            <button type="button" onClick={onClose} aria-label="Close" autoFocus className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {error && <p className="m-6 text-sm text-red-600">{error}</p>}
        {!data && !error && <p className="m-6 text-sm text-gray-400">Loading...</p>}

        {s && z && (
          <div className="px-6 py-5 font-mono text-[13px]">
            <div className="text-center mb-3">
              <p className="text-lg font-bold">{closed ? z_label(s.z_number) : "X-READING"}</p>
              <p className="text-gray-500">{s.branch?.name}</p>
              <p className="text-gray-500">Cashier: {s.cashier_name}</p>
              <p className="text-gray-500">
                {date_of(s.opened_at)} {time_of(s.opened_at)} – {closed ? time_of(s.closed_at) : "now"}
              </p>
            </div>

            <div className="border-t border-dashed border-gray-300 py-2">
              <Row label="Transactions" value={z.transactions} />
              <Row label="Items sold" value={z.items_sold} />
              <Row label="Gross sales" value={peso(z.gross)} />
              <Row label="Discounts" value={`−${peso(z.discounts)}`} />
              <Row label="Net sales" value={peso(z.net)} strong />
              <Row label="VAT (included)" value={peso(z.vat)} />
              <Row label="VAT-exempt sales" value={peso(z.vat_exempt_sales)} />
              <Row label={`Voided (${z.voided.count})`} value={peso(z.voided.total)} />
              <Row label={`Refunds (${z.refunds?.count ?? 0})`} value={peso(z.refunds?.total)} />
              {z.cart_removals && (
                <Row label={`Removed before payment (${z.cart_removals.count})`} value={peso(z.cart_removals.amount)} />
              )}
              {z.cart_removals?.after_total_shown > 0 && (
                <Row label="↳ after the total was shown" value={z.cart_removals.after_total_shown} />
              )}
            </div>

            <div className="border-t border-dashed border-gray-300 py-2">
              {z.by_payment.map((p) => (
                <Row key={p.method} label={`${method_label(p.method)} (${p.count})`} value={peso(p.total)} />
              ))}
            </div>

            <div className="border-t border-dashed border-gray-300 py-2">
              <Row label="Opening float" value={peso(z.opening_float)} />
              <Row label="+ Cash sales" value={peso(z.cash_sales)} />
              <Row label="− Cash refunds" value={peso(z.refunds?.cash)} />
              <Row label="+ Cash in" value={peso(z.cash_in)} />
              <Row label="− Cash out" value={peso(z.cash_out)} />
              <Row label="Expected cash" value={peso(z.expected_cash)} strong />
              {closed && (
                <>
                  <Row label="Counted cash" value={peso(s.counted_cash)} strong />
                  <div className="flex justify-between items-center py-1">
                    <span className="text-sm text-gray-600">Over / short</span>
                    <OverShort value={s.over_short} />
                  </div>
                </>
              )}
            </div>

            {s.movements?.length > 0 && (
              <div className="border-t border-dashed border-gray-300 py-2">
                <p className="text-gray-500 mb-1">Cash in / out</p>
                {s.movements.map((m) => (
                  <Row
                    key={m._id}
                    label={`${time_of(m.at)} ${m.reason}`}
                    value={`${m.type === "cash_in" ? "+" : "−"}${peso(m.amount)}`}
                  />
                ))}
              </div>
            )}

            {closed && (
              <p className="border-t border-dashed border-gray-300 pt-2 text-gray-500">
                Closed by {s.closed_by_name}
                {s.notes ? ` · ${s.notes}` : ""}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

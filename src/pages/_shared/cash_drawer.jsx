import { useCallback, useContext, useEffect, useState } from "react";
import axios from "axios";
import { ArrowDownCircle, ArrowUpCircle, Banknote, Lock, Unlock, Wallet } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { CashCounter } from "../../components/cash_counter";
import { ZReportModal, OverShort } from "../../components/z_report";
import { AppContext } from "../../context/app_context";
import { useDrawer } from "../../hooks/use_drawer";
import { clean_count, count_total, z_label } from "../../utils/cash";
import { date_of, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const Err = ({ text }) =>
  text ? <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{text}</p> : null;

// ─── Open drawer form ────────────────────────────────────────
const OpenDrawer = ({ onOpen }) => {
  const [count, setCount] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const total = count_total(count);

  const submit = async () => {
    setBusy(true);
    const r = await onOpen({ count: clean_count(count), opening_float: total });
    setBusy(false);
    if (!r.ok) setError(r.message);
  };

  return (
    <Panel title="Open your cash drawer">
      <p className="text-sm text-gray-600 mb-4">
        Count the starting cash (change fund) in your drawer. You can't accept cash payments until the drawer is open.
      </p>
      <CashCounter count={count} onChange={setCount} />
      <div className="mt-4 flex flex-wrap items-center gap-3 justify-end">
        <Err text={error} />
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold text-sm disabled:opacity-50"
        >
          <Unlock size={16} /> {busy ? "Opening..." : `Open drawer with ${peso(total)}`}
        </button>
      </div>
    </Panel>
  );
};

// ─── Cash in/out form ────────────────────────────────────────
const MovementForm = ({ onMove }) => {
  const [type, setType] = useState("cash_out");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await onMove({ type, amount: Number(amount), reason });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    setAmount("");
    setReason("");
    setError(null);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        {[
          ["cash_out", "Cash out", ArrowUpCircle],
          ["cash_in", "Cash in", ArrowDownCircle],
        ].map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setType(key)}
            className={cn(
              "flex items-center justify-center gap-2 py-2 rounded-lg border text-sm font-semibold",
              type === key ? "border-indigo-500 bg-indigo-50 text-indigo-700" : "border-gray-200 text-gray-600",
            )}
          >
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>
      <input
        type="number"
        min={0}
        step="0.01"
        inputMode="decimal"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="Amount (₱)"
        aria-label="Amount"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
      />
      <input
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        placeholder={type === "cash_out" ? "Reason, e.g. bought ice, paid delivery" : "Reason, e.g. change fund from manager"}
        aria-label="Reason"
        className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
      />
      <Err text={error} />
      <button
        type="submit"
        disabled={busy || !amount || !reason.trim()}
        className="w-full py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
      >
        {busy ? "Saving..." : type === "cash_out" ? "Record cash out" : "Record cash in"}
      </button>
    </form>
  );
};

// ─── Close drawer form (Z-reading) ───────────────────────────
const CloseDrawer = ({ expected, onClose, onCancel }) => {
  const [count, setCount] = useState({});
  const [notes, setNotes] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const counted = count_total(count);
  const diff = Math.round((counted - expected) * 100) / 100;

  const submit = async () => {
    setBusy(true);
    const r = await onClose({ count: clean_count(count), counted_cash: counted, notes });
    setBusy(false);
    if (!r.ok) setError(r.message);
  };

  return (
    <Panel title="Close drawer — count your cash">
      <p className="text-sm text-gray-600 mb-4">
        Count everything in the drawer. The difference from the expected amount is recorded on your Z-reading.
      </p>
      <CashCounter count={count} onChange={setCount} />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-3 text-sm">
        <span className="text-gray-500">
          Expected <span className="font-semibold text-gray-900">{peso(expected)}</span>
        </span>
        <OverShort value={diff} />
      </div>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Notes (optional) — e.g. explain a shortage"
        aria-label="Notes"
        rows={2}
        className="mt-3 w-full px-3 py-2 text-sm border border-gray-200 rounded-lg"
      />
      <div className="mt-3 flex flex-wrap items-center justify-end gap-2">
        <Err text={error} />
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">
          Cancel
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={busy}
          className="flex items-center gap-2 px-5 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
        >
          <Lock size={16} /> {busy ? "Closing..." : "Close drawer & print Z-reading"}
        </button>
      </div>
    </Panel>
  );
};

// ─── History (Z-readings) ────────────────────────────────────
const useDrawerHistory = (refreshKey) => {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let stale = false;
    axios
      .get("/api/drawer", { params: { limit: 50 } })
      .then(({ data }) => !stale && setSessions(data.sessions ?? []))
      .catch(() => {})
      .finally(() => !stale && setLoading(false));
    return () => {
      stale = true;
    };
  }, [refreshKey]);
  return { sessions, loading };
};

export default function CashDrawer() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const is_manager = userData?.role === "branch_manager";
  const drawer = useDrawer();
  const [closing, setClosing] = useState(false);
  const [report, setReport] = useState(null); // session id to show
  const [historyKey, setHistoryKey] = useState(0);
  const { sessions, loading: history_loading } = useDrawerHistory(historyKey);
  const [forceClose, setForceClose] = useState(null); // { id, amount, error }

  const bump = useCallback(() => setHistoryKey((k) => k + 1), []);

  const handleClose = async (payload) => {
    const r = await drawer.close(payload);
    if (r.ok) {
      setClosing(false);
      setReport(r.data.session._id);
      bump();
    }
    return r;
  };

  const submitForceClose = async () => {
    try {
      await axios.post(`/api/drawer/${forceClose.id}/close`, {
        counted_cash: Number(forceClose.amount),
        notes: "Closed by manager",
      });
      setReport(forceClose.id);
      setForceClose(null);
      bump();
    } catch (err) {
      setForceClose((f) => ({ ...f, error: err.response?.data?.message || err.message }));
    }
  };

  const s = drawer.session;
  const z = drawer.summary;

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header
        title="Cash Drawer"
        subtitle={
          is_admin
            ? "Z-readings from every branch."
            : "Open your drawer at the start of your shift and close it with a cash count at the end."
        }
      />

      {!is_admin &&
        (drawer.loading ? (
          <Panel><Skeleton rows={3} /></Panel>
        ) : !s ? (
          <OpenDrawer onOpen={async (p) => { const r = await drawer.open(p); if (r.ok) bump(); return r; }} />
        ) : closing ? (
          <CloseDrawer expected={z.expected_cash} onClose={handleClose} onCancel={() => setClosing(false)} />
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-1.5 rounded-full bg-green-100 text-green-700">
                <span className="size-2 rounded-full bg-green-500 animate-pulse" />
                Drawer open since {time_of(s.opened_at)}
              </span>
              <button type="button" onClick={() => setReport(s._id)} className="text-sm font-medium text-indigo-600 hover:underline">
                View X-reading
              </button>
              <button
                type="button"
                onClick={() => setClosing(true)}
                className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-semibold"
              >
                <Lock size={16} /> Close drawer
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
              <DashboardCard title="Expected in drawer" value={peso(z.expected_cash)} icon={<Wallet size={20} />} hint="float + cash sales ± in/out" />
              <DashboardCard title="Opening float" value={peso(z.opening_float)} icon={<Banknote size={20} />} />
              <DashboardCard title="Cash sales" value={peso(z.cash_sales)} icon={<ArrowDownCircle size={20} />} hint={`${z.transactions} sale(s) this shift`} />
              <DashboardCard title="Cash out / in" value={`${peso(z.cash_out)} / ${peso(z.cash_in)}`} icon={<ArrowUpCircle size={20} />} hint={z.refunds?.cash ? `${peso(z.refunds.cash)} refunded` : "paid-outs and top-ups"} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Panel title="Cash in / cash out">
                <MovementForm onMove={drawer.move} />
              </Panel>
              <Panel title="This shift's movements" className="lg:col-span-2">
                {s.movements.length === 0 ? (
                  <EmptyState>No cash in or out yet.</EmptyState>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {[...s.movements].reverse().map((m) => (
                      <li key={m._id} className="flex items-center justify-between py-2 text-sm">
                        <span className="text-gray-700">
                          <span className="text-gray-400 mr-2">{time_of(m.at)}</span>
                          {m.reason}
                        </span>
                        <span className={cn("font-semibold tabular-nums", m.type === "cash_in" ? "text-green-600" : "text-red-500")}>
                          {m.type === "cash_in" ? "+" : "−"}
                          {peso(m.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </>
        ))}

      <Panel title={is_admin || is_manager ? "Drawers & Z-readings" : "My Z-readings"}>
        {history_loading ? (
          <Skeleton rows={4} />
        ) : sessions.length === 0 ? (
          <EmptyState>No drawers yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Z no.</th>
                  {(is_admin || is_manager) && <th className="py-2 font-medium">Cashier</th>}
                  {is_admin && <th className="py-2 font-medium">Branch</th>}
                  <th className="py-2 font-medium">Opened</th>
                  <th className="py-2 font-medium">Closed</th>
                  <th className="py-2 font-medium text-right">Expected</th>
                  <th className="py-2 font-medium text-right">Counted</th>
                  <th className="py-2 font-medium text-center">Result</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {sessions.map((x) => (
                  <tr key={x._id}>
                    <td className="py-2.5 font-mono text-gray-900">{z_label(x.z_number)}</td>
                    {(is_admin || is_manager) && <td className="py-2.5 text-gray-700">{x.cashier_name}</td>}
                    {is_admin && <td className="py-2.5 text-gray-500">{x.branch?.name}</td>}
                    <td className="py-2.5 text-gray-600">{date_of(x.opened_at, { month: "short", day: "numeric" })} {time_of(x.opened_at)}</td>
                    <td className="py-2.5 text-gray-600">
                      {x.status === "open" ? <span className="text-green-600 font-medium">Open</span> : time_of(x.closed_at)}
                    </td>
                    <td className="py-2.5 text-right tabular-nums">{x.expected_cash !== undefined ? peso(x.expected_cash) : "—"}</td>
                    <td className="py-2.5 text-right tabular-nums">{x.counted_cash !== undefined ? peso(x.counted_cash) : "—"}</td>
                    <td className="py-2.5 text-center"><OverShort value={x.over_short} /></td>
                    <td className="py-2.5 text-right whitespace-nowrap">
                      <button type="button" onClick={() => setReport(x._id)} className="text-xs font-semibold text-indigo-600 hover:underline">
                        {x.status === "open" ? "X-reading" : "View"}
                      </button>
                      {x.status === "open" && (is_admin || is_manager) && String(x.cashier) !== String(userData?._id) && (
                        <button
                          type="button"
                          onClick={() => setForceClose({ id: x._id, amount: "", name: x.cashier_name })}
                          className="ml-3 text-xs font-semibold text-red-600 hover:underline"
                        >
                          Close
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {forceClose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setForceClose(null)} />
          <div role="dialog" aria-modal="true" aria-label="Close drawer" className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 space-y-3">
            <p className="font-bold text-gray-900">Close {forceClose.name}'s drawer</p>
            <p className="text-sm text-gray-600">Count the cash in their drawer and enter the total.</p>
            <input
              type="number"
              min={0}
              step="0.01"
              autoFocus
              value={forceClose.amount}
              onChange={(e) => setForceClose((f) => ({ ...f, amount: e.target.value, error: null }))}
              placeholder="Counted cash (₱)"
              aria-label="Counted cash"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg"
            />
            <Err text={forceClose.error} />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setForceClose(null)} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
              <button
                type="button"
                disabled={forceClose.amount === ""}
                onClick={submitForceClose}
                className="px-4 py-2 rounded-lg bg-red-500 text-white text-sm font-semibold disabled:opacity-50"
              >
                Close drawer
              </button>
            </div>
          </div>
        </div>
      )}

      {report && <ZReportModal sessionId={report} onClose={() => setReport(null)} />}
    </div>
  );
}

import { useContext, useState } from "react";
import { useQuery, keepPreviousData } from "@tanstack/react-query";
import axios from "axios";
import { AlertTriangle, BookUser, Plus, Search, Users, Wallet, X } from "lucide-react";
import Header from "../../components/header";
import { DashboardCard } from "../../components/card";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useBranches } from "../../hooks/use_branches";
import { get, queryClient, error_message } from "../../lib/query";
import { date_of, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ["customers"] });
  queryClient.invalidateQueries({ queryKey: ["drawer"] });
};
const days_since = (d) => (d ? Math.floor((Date.now() - new Date(d)) / 86400000) : 0);
const ENTRY = {
  charge: ["Bought on utang", "text-orange-600"],
  payment: ["Paid", "text-green-700"],
  refund: ["Refund / void", "text-green-700"],
  adjustment: ["Adjustment", "text-gray-700"],
};
const field = "px-3 py-2 text-sm border border-gray-200 rounded-lg";

// Add customer dialog — mounted only while open.
const AddCustomer = ({ is_admin, is_manager, branch, onClose }) => {
  const [f, setF] = useState({ name: "", phone: "", address: "", credit_limit: 500, notes: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await axios.post("/api/customers", { ...f, credit_limit: is_manager ? Number(f.credit_limit) || 0 : undefined, branch: is_admin ? branch : undefined });
      refresh();
      onClose();
    } catch (err) {
      setError(error_message(err));
      setBusy(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
      <form onSubmit={save} role="dialog" aria-modal="true" aria-label="Add customer" onKeyDown={(e) => e.key === "Escape" && onClose()} className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-3">
        <p className="text-lg font-bold text-gray-900">Add utang customer</p>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Name *
          <input autoFocus value={f.name} onChange={set("name")} placeholder="e.g. Aling Nena" className={field} />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Mobile
            <input value={f.phone} onChange={set("phone")} placeholder="09XX XXX XXXX" className={field} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Credit limit (₱)
            <input type="number" min={0} value={f.credit_limit} onChange={set("credit_limit")} disabled={!is_manager} className={cn(field, !is_manager && "bg-gray-50")} />
            <span className="text-[11px] text-gray-400">{is_manager ? "0 = no limit" : "Set by your manager (₱500 default)"}</span>
          </label>
        </div>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Address
          <input value={f.address} onChange={set("address")} placeholder="e.g. Blk 5 Lot 2, Purok 3" className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Notes
          <input value={f.notes} onChange={set("notes")} placeholder="e.g. pays every 15th and 30th" className={field} />
        </label>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
          <button type="submit" disabled={busy || !f.name.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving..." : "Add customer"}
          </button>
        </div>
      </form>
    </div>
  );
};

// One customer's ledger with payment / limit / adjustment actions.
const CustomerPanel = ({ id, is_manager, onClose }) => {
  const q = useQuery({ queryKey: ["customers", "ledger", id], queryFn: () => get(`/api/customers/${id}/ledger`) });
  const [pay, setPay] = useState({ amount: "", method: "cash", reference: "" });
  const [adj, setAdj] = useState(null); // { amount, note }
  const [limit, setLimit] = useState(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const cst = q.data?.customer;
  const entries = q.data?.entries ?? [];

  const run = async (fn, ok) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      refresh();
      setMsg({ ok: true, text: ok });
      return true;
    } catch (err) {
      setMsg({ ok: false, text: error_message(err) });
      return false;
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <aside role="dialog" aria-modal="true" aria-label="Customer" onKeyDown={(e) => e.key === "Escape" && onClose()} className="relative bg-white w-full max-w-lg h-full overflow-y-auto shadow-xl">
        <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-start justify-between gap-3">
          <div>
            <p className="text-lg font-bold text-gray-900">{cst?.name ?? "Customer"}</p>
            <p className="text-xs text-gray-400">{[cst?.phone, cst?.address].filter(Boolean).join(" · ") || "No contact details"}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>
        {q.isPending || !cst ? (
          <div className="p-5"><Skeleton rows={5} /></div>
        ) : (
          <div className="p-5 space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-orange-50 p-4">
                <p className="text-xs text-orange-700">{cst.balance < 0 ? "Store owes them" : "Owes"}</p>
                <p className="text-2xl font-bold text-orange-700 tabular-nums">{peso(Math.abs(cst.balance))}</p>
                {cst.owing_since && cst.balance > 0 && <p className="text-xs text-orange-600">since {date_of(cst.owing_since)} ({days_since(cst.owing_since)} days)</p>}
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <p className="text-xs text-gray-500">Credit limit</p>
                {limit === null ? (
                  <p className="text-2xl font-bold text-gray-800 tabular-nums">
                    {cst.credit_limit ? peso(cst.credit_limit) : "No limit"}
                    {is_manager && (
                      <button type="button" onClick={() => setLimit(String(cst.credit_limit))} className="ml-2 text-xs font-semibold text-indigo-600 underline">Change</button>
                    )}
                  </p>
                ) : (
                  <div className="flex gap-2 mt-1">
                    <input type="number" min={0} value={limit} onChange={(e) => setLimit(e.target.value)} aria-label="New credit limit" className={cn(field, "w-24")} />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={async () => (await run(() => axios.patch(`/api/customers/${id}`, { credit_limit: Number(limit) || 0 }), "Credit limit saved.")) && setLimit(null)}
                      className="px-3 rounded-lg bg-indigo-600 text-white text-xs font-semibold"
                    >
                      Save
                    </button>
                  </div>
                )}
                {cst.last_payment_at && <p className="text-xs text-gray-400">last paid {date_of(cst.last_payment_at)}</p>}
              </div>
            </div>

            {cst.balance > 0 && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (await run(() => axios.post(`/api/customers/${id}/payments`, { ...pay, amount: Number(pay.amount) }), `Payment of ${peso(pay.amount)} recorded.`))
                    setPay({ amount: "", method: "cash", reference: "" });
                }}
                className="rounded-xl border border-green-200 bg-green-50/50 p-4 space-y-2"
              >
                <p className="text-sm font-semibold text-green-800">Record a payment</p>
                <div className="flex flex-wrap gap-2">
                  <input type="number" min={0} step="0.01" value={pay.amount} onChange={(e) => setPay((p) => ({ ...p, amount: e.target.value }))} placeholder="Amount" aria-label="Payment amount" className={cn(field, "w-32 bg-white")} />
                  <select value={pay.method} onChange={(e) => setPay((p) => ({ ...p, method: e.target.value }))} aria-label="Payment method" className={cn(field, "bg-white")}>
                    <option value="cash">Cash</option>
                    <option value="gcash">GCash</option>
                  </select>
                  <button type="button" onClick={() => setPay((p) => ({ ...p, amount: String(cst.balance) }))} className="px-3 py-2 text-xs rounded-lg border border-green-300 bg-white text-green-800">Full {peso(cst.balance)}</button>
                  {pay.method === "gcash" && <input value={pay.reference} onChange={(e) => setPay((p) => ({ ...p, reference: e.target.value }))} placeholder="GCash ref" aria-label="GCash reference" className={cn(field, "w-36 bg-white")} />}
                  <button type="submit" disabled={busy || !(Number(pay.amount) > 0)} className="px-4 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold disabled:opacity-50">Save payment</button>
                </div>
                {pay.method === "cash" && <p className="text-xs text-gray-500">Cash goes into your open cash drawer.</p>}
              </form>
            )}

            {is_manager && (
              adj ? (
                <div className="rounded-xl border border-gray-200 p-4 space-y-2">
                  <p className="text-sm font-semibold text-gray-800">Adjust balance</p>
                  <div className="flex flex-wrap gap-2">
                    <input type="number" step="0.01" value={adj.amount} onChange={(e) => setAdj((a) => ({ ...a, amount: e.target.value }))} placeholder="+ adds, − removes" aria-label="Adjustment amount" className={cn(field, "w-36")} />
                    <input value={adj.note} onChange={(e) => setAdj((a) => ({ ...a, note: e.target.value }))} placeholder="Reason (required)" aria-label="Adjustment reason" className={cn(field, "flex-1 min-w-40")} />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button type="button" onClick={() => setAdj(null)} className="px-3 py-1.5 text-xs rounded-lg border border-gray-200">Cancel</button>
                    <button
                      type="button"
                      disabled={busy || !Number(adj.amount) || !adj.note.trim()}
                      onClick={async () => (await run(() => axios.post(`/api/customers/${id}/adjust`, { amount: Number(adj.amount), note: adj.note }), "Balance adjusted.")) && setAdj(null)}
                      className="px-3 py-1.5 text-xs rounded-lg bg-indigo-600 text-white font-semibold disabled:opacity-50"
                    >
                      Save adjustment
                    </button>
                  </div>
                </div>
              ) : (
                <button type="button" onClick={() => setAdj({ amount: "", note: "" })} className="text-xs font-semibold text-indigo-600 underline">Adjust balance (correction)</button>
              )
            )}
            {msg && <p className={cn("text-sm rounded-lg px-3 py-2", msg.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>{msg.text}</p>}

            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">History</p>
              {entries.length === 0 ? (
                <EmptyState>No utang yet.</EmptyState>
              ) : (
                <ul className="divide-y divide-gray-50">
                  {entries.map((e) => {
                    const [label, tone] = ENTRY[e.type] ?? [e.type, ""];
                    return (
                      <li key={e._id} className="py-2.5 flex justify-between gap-3 text-sm">
                        <div className="min-w-0">
                          <p className="font-medium text-gray-900">
                            {label}
                            {e.order_number && <span className="font-normal text-gray-400"> · {e.order_number}</span>}
                            {e.method && e.type === "payment" && <span className="font-normal text-gray-400"> · {e.method === "gcash" ? "GCash" : "Cash"}</span>}
                          </p>
                          <p className="text-xs text-gray-400">
                            {date_of(e.createdAt, { month: "short", day: "numeric" })} {time_of(e.createdAt)} · {e.by_name}
                            {e.approved_by_name && ` · approved by ${e.approved_by_name}`}
                            {e.note && ` · ${e.note}`}
                          </p>
                        </div>
                        <div className="text-right shrink-0 tabular-nums">
                          <p className={cn("font-semibold", tone)}>{e.amount > 0 ? "+" : "−"}{peso(Math.abs(e.amount))}</p>
                          <p className="text-xs text-gray-400">bal {peso(e.balance_after)}</p>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        )}
      </aside>
    </div>
  );
};

export default function Utang() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const is_manager = ["admin", "branch_manager"].includes(userData?.role);
  const branches = useBranches({ enabled: is_admin });
  const [branchChoice, setBranch] = useState("");
  const branch = is_admin ? branchChoice : undefined;
  const [search, setSearch] = useState("");
  const [owing, setOwing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [open, setOpen] = useState(null);
  const params = { ...(search.trim() && { q: search.trim() }), ...(owing && { owing: "1" }), ...(branch && { branch }) };
  const q = useQuery({ queryKey: ["customers", "list", params], queryFn: () => get("/api/customers", params), placeholderData: keepPreviousData });
  const customers = q.data?.customers ?? [];
  const t = q.data?.totals ?? {};

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Utang" subtitle="Customers who buy on credit: what they owe, and their payments." />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DashboardCard title="Total receivable" sign="₱" value={Number(t.receivable ?? 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })} loading={q.isPending} icon={<Wallet size={20} />} hint="owed to the store" />
        <DashboardCard title="Customers owing" value={t.owing ?? 0} loading={q.isPending} icon={<Users size={20} />} hint="with a balance" />
        <DashboardCard title="Over 30 days" value={t.overdue ?? 0} loading={q.isPending} icon={<AlertTriangle size={20} />} hint="owing for more than a month" />
      </div>

      <Panel
        title={`Customers (${customers.length})`}
        action={
          <button type="button" onClick={() => setAdding(true)} disabled={is_admin && !branch} title={is_admin && !branch ? "Choose a branch first" : undefined} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">
            <Plus size={14} /> Add customer
          </button>
        }
      >
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search name" aria-label="Search customers" className={cn(field, "w-full pl-8")} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-600">
            <input type="checkbox" checked={owing} onChange={(e) => setOwing(e.target.checked)} /> Owing only
          </label>
          {is_admin && (
            <select value={branchChoice} onChange={(e) => setBranch(e.target.value)} aria-label="Branch" className={cn(field, "bg-white")}>
              <option value="">All branches</option>
              {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </select>
          )}
        </div>
        {q.isPending ? (
          <Skeleton rows={4} />
        ) : customers.length === 0 ? (
          <EmptyState>{search || owing ? "No customers match." : "No utang customers yet. Add one here or when charging a sale to Utang."}</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                  <th className="py-2 font-medium">Customer</th>
                  <th className="py-2 font-medium">Owing since</th>
                  <th className="py-2 font-medium text-right">Limit</th>
                  <th className="py-2 font-medium text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {customers.map((x) => {
                  const days = days_since(x.owing_since);
                  const over = x.credit_limit > 0 && x.balance > x.credit_limit;
                  return (
                    <tr key={x._id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setOpen(x._id)}>
                      <td className="py-2.5">
                        <button type="button" className="font-medium text-gray-900 text-left hover:underline" onClick={() => setOpen(x._id)}>
                          <BookUser size={14} className="inline mr-1.5 text-gray-400" />
                          {x.name}
                        </button>
                        <p className="text-xs text-gray-400">{[x.phone, is_admin && x.branch?.name].filter(Boolean).join(" · ")}</p>
                      </td>
                      <td className={cn("py-2.5 text-xs", days > 30 ? "text-red-600 font-semibold" : "text-gray-500")}>
                        {x.balance > 0 && x.owing_since ? `${date_of(x.owing_since, { month: "short", day: "numeric" })} · ${days} day(s)` : "—"}
                      </td>
                      <td className="py-2.5 text-right text-gray-500 tabular-nums">{x.credit_limit ? peso(x.credit_limit) : "No limit"}</td>
                      <td className={cn("py-2.5 text-right font-semibold tabular-nums", x.balance > 0 ? (over ? "text-red-600" : "text-orange-600") : "text-gray-400")}>
                        {peso(x.balance)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {q.error && <p className="text-sm text-red-600">{error_message(q.error)}</p>}
      {adding && <AddCustomer is_admin={is_admin} is_manager={is_manager} branch={branch} onClose={() => setAdding(false)} />}
      {open && <CustomerPanel id={open} is_manager={is_manager} onClose={() => setOpen(null)} />}
    </div>
  );
}

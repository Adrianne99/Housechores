import { useContext, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { ArrowRight, PackageCheck, Search, Send, Trash2, X } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useProducts } from "../../hooks/use_product_lookup";
import { get, queryClient, error_message } from "../../lib/query";
import { date_of, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const STATUS = {
  in_transit: ["On the way", "bg-amber-100 text-amber-800"],
  received: ["Received", "bg-green-100 text-green-700"],
  cancelled: ["Cancelled", "bg-gray-100 text-gray-500"],
};
const refresh = () => {
  queryClient.invalidateQueries({ queryKey: ["transfers"] });
  queryClient.invalidateQueries({ queryKey: ["products"] });
};

const NewTransfer = ({ branches, my_branch, is_admin, onDone }) => {
  const [from, setFrom] = useState(is_admin ? branches[0]?._id ?? "" : my_branch);
  const [to, setTo] = useState("");
  const [lines, setLines] = useState([]); // { inventory_id, name, unit, available, quantity }
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const { data: products = [] } = useProducts(is_admin ? from : undefined, { enabled: !!from });
  const matches = useMemo(() => {
    const s = query.trim().toLowerCase();
    if (!s) return [];
    return products
      .filter((p) => p.stock_management.current_stock > 0 && !lines.some((l) => l.inventory_id === p._id))
      .filter((p) => p.name.toLowerCase().includes(s) || p.barcode.includes(s))
      .slice(0, 6);
  }, [query, products, lines]);
  const targets = branches.filter((b) => b._id !== from);
  const valid = to && lines.length && lines.every((l) => Number.isInteger(Number(l.quantity)) && Number(l.quantity) > 0 && Number(l.quantity) <= l.available);

  const send = async () => {
    setBusy(true);
    setError(null);
    try {
      await axios.post("/api/stock/transfers", {
        from_branch: is_admin ? from : undefined,
        to_branch: to,
        notes,
        items: lines.map((l) => ({ inventory_id: l.inventory_id, quantity: Number(l.quantity) })),
      });
      refresh();
      onDone();
    } catch (err) {
      setError(error_message(err));
      setBusy(false);
    }
  };

  const field = "px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {is_admin ? (
          <select value={from} onChange={(e) => (setFrom(e.target.value), setLines([]))} aria-label="Send from" className={field}>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        ) : (
          <span className="px-3 py-2 text-sm rounded-lg bg-gray-50 font-medium">{branches.find((b) => b._id === my_branch)?.name ?? "My branch"}</span>
        )}
        <ArrowRight size={16} className="text-gray-400" />
        <select value={to} onChange={(e) => setTo(e.target.value)} aria-label="Send to" className={field}>
          <option value="">Send to…</option>
          {targets.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
        </select>
      </div>
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search or scan a product to send" aria-label="Add product to transfer" className="w-full pl-9 pr-3 py-2.5 text-sm border border-gray-200 rounded-lg" />
        {matches.length > 0 && (
          <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-64 overflow-y-auto">
            {matches.map((p) => (
              <li key={p._id}>
                <button
                  type="button"
                  onClick={() => {
                    setLines((ls) => [...ls, { inventory_id: p._id, name: p.name, unit: p.unit, available: p.stock_management.current_stock, quantity: 1 }]);
                    setQuery("");
                  }}
                  className="w-full text-left px-3 py-2 hover:bg-indigo-50 flex justify-between gap-3 text-sm"
                >
                  <span className="font-medium text-gray-900">{p.name}</span>
                  <span className="text-xs text-gray-500">{p.stock_management.current_stock} in stock</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {lines.length === 0 ? (
        <EmptyState>Add the products you're sending.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-50">
          {lines.map((l) => (
            <li key={l.inventory_id} className="py-2 flex items-center gap-3 text-sm">
              <span className="flex-1 font-medium text-gray-900">{l.name} <span className="text-xs font-normal text-gray-400">· {l.available} available</span></span>
              <input
                type="number"
                min={1}
                max={l.available}
                value={l.quantity}
                onChange={(e) => setLines((ls) => ls.map((x) => (x.inventory_id === l.inventory_id ? { ...x, quantity: e.target.value } : x)))}
                aria-label={`Quantity of ${l.name} to send`}
                className={cn("w-20 px-2 py-1.5 border rounded-md text-right", Number(l.quantity) > l.available ? "border-red-300" : "border-gray-200")}
              />
              <span className="text-xs text-gray-400 w-12">{l.unit}</span>
              <button type="button" onClick={() => setLines((ls) => ls.filter((x) => x.inventory_id !== l.inventory_id))} aria-label={`Remove ${l.name}`} className="p-1 text-gray-300 hover:text-red-500">
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      )}
      <input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note (optional), e.g. sent with Kuya Ben's jeep" aria-label="Transfer note" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
      {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onDone} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
        <button type="button" onClick={send} disabled={!valid || busy} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
          <Send size={15} /> {busy ? "Sending..." : "Send stock"}
        </button>
      </div>
      <p className="text-xs text-gray-400">Stock leaves your branch now and is added to theirs when they confirm it arrived.</p>
    </div>
  );
};

export default function Transfers() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const my_branch = String(userData?.branch?._id ?? userData?.branch ?? "");
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const branches_q = useQuery({ queryKey: ["transfers", "branches"], queryFn: () => get("/api/stock/branches") });
  const branches = branches_q.data?.branches ?? [];
  const q = useQuery({ queryKey: ["transfers", "list"], queryFn: () => get("/api/stock/transfers"), refetchInterval: 60_000 });
  const transfers = q.data?.transfers ?? [];
  const incoming = transfers.filter((t) => t.status === "in_transit" && (is_admin || t.to_branch?._id === my_branch));

  const act = async (t, what) => {
    if (what === "cancel" && !window.confirm(`Cancel ${t.transfer_number}? The stock goes back to ${t.from_branch?.name}.`)) return;
    setBusy(t._id);
    setMsg(null);
    try {
      await axios.post(`/api/stock/transfers/${t._id}/${what}`);
      refresh();
      setMsg({ ok: true, text: what === "receive" ? `${t.transfer_number} received — stock added.` : `${t.transfer_number} cancelled — stock returned.` });
    } catch (err) {
      setMsg({ ok: false, text: error_message(err) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Stock Transfers" subtitle="Move stock between branches. Both sides are recorded." />

      {incoming.length > 0 && !is_admin && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          {incoming.length} transfer(s) on the way to your branch — confirm them when the stock arrives.
        </p>
      )}
      {msg && <p className={cn("text-sm rounded-xl px-4 py-2", msg.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>{msg.text}</p>}

      <Panel
        title={creating ? "Send stock" : `Transfers (${transfers.length})`}
        action={
          creating ? (
            <button type="button" onClick={() => setCreating(false)} aria-label="Close" className="p-1 text-gray-400"><X size={16} /></button>
          ) : (
            <button type="button" onClick={() => setCreating(true)} disabled={branches.length < 2} title={branches.length < 2 ? "You need at least two branches" : undefined} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold disabled:opacity-50">
              <Send size={14} /> Send stock
            </button>
          )
        }
      >
        {creating ? (
          <NewTransfer branches={branches} my_branch={my_branch} is_admin={is_admin} onDone={() => setCreating(false)} />
        ) : q.isPending ? (
          <Skeleton rows={4} />
        ) : transfers.length === 0 ? (
          <EmptyState>No transfers yet.</EmptyState>
        ) : (
          <ul className="space-y-3">
            {transfers.map((t) => {
              const [label, tone] = STATUS[t.status] ?? [t.status, ""];
              const can_receive = t.status === "in_transit" && (is_admin || t.to_branch?._id === my_branch);
              const can_cancel = t.status === "in_transit" && (is_admin || t.from_branch?._id === my_branch);
              return (
                <li key={t._id} className="border border-gray-100 rounded-xl p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-gray-900 flex items-center gap-2">
                      {t.from_branch?.name} <ArrowRight size={14} className="text-gray-400" /> {t.to_branch?.name}
                    </p>
                    <span className={cn("text-xs font-semibold px-2.5 py-0.5 rounded-full", tone)}>{label}</span>
                    <span className="ml-auto text-xs text-gray-400">
                      {t.transfer_number} · {date_of(t.createdAt, { month: "short", day: "numeric" })} {time_of(t.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{t.items.map((i) => `${i.quantity} × ${i.name}`).join(", ")}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    {t.total_units} unit(s) · {peso(t.total_cost)} at cost · sent by {t.sent_by_name}
                    {t.received_by_name && ` · received by ${t.received_by_name}`}
                    {t.cancelled_by_name && ` · cancelled by ${t.cancelled_by_name}`}
                    {t.notes && ` · “${t.notes}”`}
                  </p>
                  {(can_receive || can_cancel) && (
                    <div className="flex justify-end gap-2 mt-3">
                      {can_cancel && (
                        <button type="button" onClick={() => act(t, "cancel")} disabled={busy === t._id} className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 disabled:opacity-50">
                          Cancel transfer
                        </button>
                      )}
                      {can_receive && (
                        <button type="button" onClick={() => act(t, "receive")} disabled={busy === t._id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-600 text-white text-xs font-semibold disabled:opacity-50">
                          <PackageCheck size={14} /> Confirm received
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </Panel>
    </div>
  );
}

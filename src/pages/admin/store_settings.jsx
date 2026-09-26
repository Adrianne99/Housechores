import { useState } from "react";
import axios from "axios";
import { useQuery } from "@tanstack/react-query";
import { Pencil, Plus, Printer, Store, Trash2 } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { useBranches } from "../../hooks/use_branches";
import { get, queryClient, error_message } from "../../lib/query";
import { print_receipt, receipt_lines } from "../../utils/receipt_print";
import { cn } from "../../utils/utils";

const field = "px-3 py-2 text-sm border border-gray-200 rounded-lg";
const money = (n) => `₱${Number(n).toFixed(2)}`;

// A small made-up sale for the preview and the test print.
const SAMPLE = {
  order_number: "ORD-MAN-20260925-0001",
  createdAt: new Date().toISOString(),
  cashier: { name: "Maria Santos" },
  branch: { name: "Manila Branch", address: "" },
  items: [
    { product_snapshot: { name: "Lucky Me Pancit Canton 60g" }, quantity: 2, unit_price: 12, subtotal: 24 },
    { product_snapshot: { name: "Coca-Cola 1.5L" }, quantity: 1, unit_price: 75, subtotal: 75 },
  ],
  subtotal: 99,
  discount_amount: 0,
  total: 99,
  vat_amount: 10.61,
  payment: { method: "cash", amount_tendered: 100, change: 1 },
};

// Store details form — mounted with the loaded settings.
const DetailsForm = ({ initial }) => {
  const [f, setF] = useState({ ...initial, methods_text: initial.payment_methods.join(", ") });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const { data } = await axios.put("/api/settings", { ...f, payment_methods: f.methods_text.split(",") });
      queryClient.setQueryData(["settings"], { success: true, settings: data.settings });
      setMsg({ ok: true, text: "Saved. New receipts use these details." });
    } catch (err) {
      setMsg({ ok: false, text: error_message(err) });
    } finally {
      setBusy(false);
    }
  };
  const r = receipt_lines(SAMPLE, f);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
      <Panel title="Receipt details" className="xl:col-span-2">
        <form onSubmit={save} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Store name
              <input value={f.store_name} onChange={set("store_name")} placeholder="e.g. Aling Nena's Sari-Sari Store" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Owner / business name
              <input value={f.owner_name} onChange={set("owner_name")} placeholder="Registered business name" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1 sm:col-span-2">
              Address <span className="text-gray-400">(each branch's own address is used first)</span>
              <input value={f.address} onChange={set("address")} className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              TIN
              <input value={f.tin} onChange={set("tin")} placeholder="123-456-789-000" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Phone
              <input value={f.phone} onChange={set("phone")} placeholder="0917 123 4567" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1 sm:col-span-2">
              Receipt footer
              <input value={f.receipt_footer} onChange={set("receipt_footer")} className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1 sm:col-span-2">
              Logo link <span className="text-gray-400">(optional, https://…; also used on supplier emails)</span>
              <input value={f.logo_url} onChange={set("logo_url")} placeholder="https://…/logo.png" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Receipt printer paper
              <select value={f.paper_width} onChange={set("paper_width")} className={cn(field, "bg-white")}>
                <option value="58">58 mm (small thermal)</option>
                <option value="80">80 mm (wide thermal)</option>
              </select>
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1 sm:col-span-2">
              Payment methods <span className="text-gray-400">(comma-separated; Cash is always included)</span>
              <input value={f.methods_text} onChange={set("methods_text")} placeholder="Cash, GCash, Maya, Bank Transfer" className={field} />
            </label>
            <label className="text-xs text-gray-500 flex flex-col gap-1">
              Cash drawer alert (₱ over/short)
              <input type="number" min={0} value={f.cash_variance_limit} onChange={set("cash_variance_limit")} className={field} />
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-700 mt-5">
              <input type="checkbox" checked={f.vat_registered} onChange={set("vat_registered")} />
              VAT-registered (show VATable sales and VAT on receipts)
            </label>
          </div>
          {msg && <p className={cn("text-sm rounded-lg px-3 py-2", msg.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>{msg.text}</p>}
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => print_receipt(SAMPLE, f)} className="flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-200 text-sm">
              <Printer size={15} /> Test print
            </button>
            <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
              {busy ? "Saving..." : "Save details"}
            </button>
          </div>
        </form>
      </Panel>

      <Panel title="Preview">
        <div className={cn("mx-auto font-mono text-[11px] leading-snug text-gray-800 bg-white border border-dashed border-gray-300 p-3 space-y-1", f.paper_width === "80" ? "max-w-[300px]" : "max-w-[220px]")}>
          <div className="text-center">
            {r.logo && <img src={r.logo} alt="" className="mx-auto max-h-10 mb-1" />}
            <p className="font-bold text-xs">{r.store}</p>
            {r.branch && <p>{r.branch}</p>}
            {r.address && <p>{r.address}</p>}
            {r.phone && <p>{r.phone}</p>}
            {r.tin && <p>{r.tin}</p>}
          </div>
          <div className="border-t border-dashed border-gray-300 my-1" />
          {SAMPLE.items.map((i) => (
            <div key={i.product_snapshot.name}>
              <p>{i.product_snapshot.name}</p>
              <p className="flex justify-between pl-2 text-gray-500"><span>{i.quantity} × {money(i.unit_price)}</span><span>{money(i.subtotal)}</span></p>
            </div>
          ))}
          <div className="border-t border-dashed border-gray-300 my-1" />
          <p className="flex justify-between font-bold"><span>TOTAL</span><span>{money(SAMPLE.total)}</span></p>
          {r.vat_rows.map(([l, v]) => (
            <p key={l} className="flex justify-between text-gray-500"><span>{l}</span><span>{money(v)}</span></p>
          ))}
          <div className="border-t border-dashed border-gray-300 my-1" />
          <p className="text-center">{r.footer}</p>
          <p className="text-center text-[9px] text-gray-400">THIS IS NOT AN OFFICIAL RECEIPT</p>
        </div>
        <p className="text-xs text-gray-400 mt-3">
          Only BIR-accredited POS systems can issue official receipts, so these print as acknowledgment receipts.
        </p>
      </Panel>
    </div>
  );
};

// Branches: add, rename, change address, delete.
const Branches = () => {
  const branches = useBranches();
  const [editing, setEditing] = useState(null); // { _id?, name, address }
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);
  const reload = () => queryClient.invalidateQueries({ queryKey: ["branches"] });
  const run = async (fn, ok) => {
    setBusy(true);
    setMsg(null);
    try {
      await fn();
      reload();
      setMsg({ ok: true, text: ok });
      setEditing(null);
    } catch (err) {
      setMsg({ ok: false, text: error_message(err) });
    } finally {
      setBusy(false);
    }
  };
  const save = () =>
    run(
      () => (editing._id ? axios.patch(`/api/branches/${editing._id}`, editing) : axios.post("/api/branches", editing)),
      editing._id ? "Branch updated." : "Branch added.",
    );

  return (
    <Panel
      title={`Branches (${branches.length})`}
      action={
        <button type="button" onClick={() => setEditing({ name: "", address: "" })} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
          <Plus size={14} /> Add branch
        </button>
      }
    >
      {msg && <p className={cn("text-sm rounded-lg px-3 py-2 mb-3", msg.ok ? "text-green-700 bg-green-50" : "text-red-600 bg-red-50")}>{msg.text}</p>}
      {editing && (
        <div className="flex flex-wrap gap-2 mb-4 rounded-xl bg-gray-50 p-3">
          <input autoFocus value={editing.name} onChange={(e) => setEditing((b) => ({ ...b, name: e.target.value }))} placeholder="Branch name" aria-label="Branch name" className={cn(field, "bg-white")} />
          <input value={editing.address} onChange={(e) => setEditing((b) => ({ ...b, address: e.target.value }))} placeholder="Address (printed on receipts)" aria-label="Branch address" className={cn(field, "bg-white flex-1 min-w-48")} />
          <button type="button" onClick={() => setEditing(null)} className="px-3 py-2 rounded-lg border border-gray-200 text-sm bg-white">Cancel</button>
          <button type="button" onClick={save} disabled={busy || !editing.name.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving..." : "Save branch"}
          </button>
        </div>
      )}
      {branches.length === 0 ? (
        <EmptyState>No branches yet.</EmptyState>
      ) : (
        <ul className="divide-y divide-gray-50">
          {branches.map((b) => (
            <li key={b._id} className="py-3 flex items-center gap-3">
              <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Store size={16} /></span>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900">{b.name}</p>
                <p className="text-xs text-gray-400">{b.address || "No address yet"}</p>
              </div>
              <button type="button" onClick={() => setEditing({ _id: b._id, name: b.name, address: b.address ?? "" })} aria-label={`Edit ${b.name}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500">
                <Pencil size={14} />
              </button>
              <button
                type="button"
                onClick={() => window.confirm(`Delete ${b.name}? This also deletes its product list and stock. Past sales stay in reports. Staff must be moved to another branch first.`) && run(() => axios.delete(`/api/branches/${b._id}`), "Branch deleted.")}
                aria-label={`Delete ${b.name}`}
                className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
};

export default function StoreSettings() {
  const q = useQuery({ queryKey: ["settings"], queryFn: () => get("/api/settings") });
  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Store Settings" subtitle="Your store's details on receipts and emails, and your branches." />
      {q.isPending ? <Panel><Skeleton rows={6} /></Panel> : <DetailsForm initial={q.data.settings} />}
      <Branches />
    </div>
  );
}

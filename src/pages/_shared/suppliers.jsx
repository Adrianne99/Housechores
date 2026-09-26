import { useContext, useState } from "react";
import { AlertTriangle, Mail, Pencil, Phone, Plus, Trash2, Truck, User } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { useSuppliers, purchasing } from "../../hooks/use_purchasing";
import { error_message } from "../../lib/query";

const EMPTY = {
  name: "", contact_person: "", email: "", phone: "", lead_time_days: 2, notes: "",
  address: "", telegram: "", preferred_contact: "email", delivery_days: "", min_order_value: 0,
};

// Add / edit dialog — mounted only while open, so it starts from `initial`.
const SupplierDialog = ({ initial, onClose }) => {
  const [form, setForm] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    const r = await purchasing.save_supplier(initial?._id, {
      ...form,
      lead_time_days: Number(form.lead_time_days) || 0,
      min_order_value: Number(form.min_order_value) || 0,
    });
    setBusy(false);
    if (!r.ok) return setError(r.message);
    onClose();
  };

  const field = "px-3 py-2 text-sm border border-gray-200 rounded-lg";
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={busy ? undefined : onClose} />
      <form
        onSubmit={save}
        role="dialog"
        aria-modal="true"
        aria-label="Supplier"
        onKeyDown={(e) => e.key === "Escape" && onClose()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-3 max-h-[92vh] overflow-y-auto"
      >
        <p className="text-lg font-bold text-gray-900">{initial?._id ? "Edit supplier" : "Add supplier"}</p>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Supplier name *
          <input autoFocus value={form.name} onChange={set("name")} className={field} placeholder="e.g. Monde Nissin" />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Order email * <span className="text-gray-400">(restock orders are emailed here)</span>
          <input type="email" value={form.email} onChange={set("email")} className={field} placeholder="orders@supplier.com" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Contact person
            <input value={form.contact_person} onChange={set("contact_person")} className={field} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Mobile
            <input value={form.phone} onChange={set("phone")} className={field} placeholder="09XX XXX XXXX" />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Telegram
            <input value={form.telegram} onChange={set("telegram")} className={field} placeholder="@username" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Preferred contact
            <select value={form.preferred_contact} onChange={set("preferred_contact")} className={`${field} bg-white`}>
              <option value="email">Email</option>
              <option value="phone">Phone call</option>
              <option value="sms">SMS</option>
              <option value="telegram">Telegram</option>
              <option value="messenger">Messenger</option>
            </select>
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Usual delivery time (days)
            <input type="number" min={0} max={90} value={form.lead_time_days} onChange={set("lead_time_days")} className={field} />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Delivery days
            <input value={form.delivery_days} onChange={set("delivery_days")} className={field} placeholder="e.g. Tue, Fri" />
          </label>
          <label className="text-xs text-gray-500 flex flex-col gap-1">
            Minimum order (₱)
            <input type="number" min={0} value={form.min_order_value} onChange={set("min_order_value")} className={field} />
          </label>
        </div>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Address
          <input value={form.address} onChange={set("address")} className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Notes
          <textarea rows={2} value={form.notes} onChange={set("notes")} className={field} placeholder="Anything else to remember" />
        </label>
        {error && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
          <button type="submit" disabled={busy || !form.name.trim()} className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
            {busy ? "Saving..." : "Save supplier"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default function Suppliers() {
  const { userData } = useContext(AppContext);
  const q = useSuppliers();
  const [editing, setEditing] = useState(null); // {} for new, supplier to edit
  const [error, setError] = useState(null);
  const suppliers = q.data?.suppliers ?? [];
  const unlisted = q.data?.unlisted ?? [];
  const missing_email = suppliers.filter((s) => !s.email).length;

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Suppliers" subtitle="Who you order stock from. Restock orders are emailed to the address here." />

      {missing_email > 0 && (
        <p className="text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <AlertTriangle size={16} /> {missing_email} supplier(s) have no email yet — their restock orders can't be sent until you add one.
        </p>
      )}
      {error && <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-2">{error}</p>}

      <Panel
        title={`Suppliers (${suppliers.length})`}
        action={
          <button type="button" onClick={() => setEditing({})} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-semibold">
            <Plus size={14} /> Add supplier
          </button>
        }
      >
        {q.isPending ? (
          <Skeleton rows={4} />
        ) : suppliers.length === 0 ? (
          <EmptyState>No suppliers yet. Add one, or pick from the names already on your products below.</EmptyState>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {suppliers.map((s) => (
              <div key={s._id} className="border border-gray-100 rounded-xl p-4 flex flex-col gap-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600 shrink-0"><Truck size={16} /></span>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      <p className="text-xs text-gray-400">{s.products} product(s) · ~{s.lead_time_days} day(s) delivery</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button type="button" onClick={() => setEditing(s)} aria-label={`Edit ${s.name}`} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-500"><Pencil size={14} /></button>
                    {userData?.role === "admin" && (
                      <button
                        type="button"
                        aria-label={`Remove ${s.name}`}
                        onClick={async () => {
                          if (!window.confirm(`Remove ${s.name}?`)) return;
                          const r = await purchasing.remove_supplier(s._id);
                          setError(r.ok ? null : r.message);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
                <p className="text-sm flex items-center gap-2 text-gray-700">
                  <Mail size={14} className="text-gray-400" />
                  {s.email || <span className="text-amber-600 font-medium">No email — add one to send orders</span>}
                </p>
                {s.phone && <p className="text-sm flex items-center gap-2 text-gray-700"><Phone size={14} className="text-gray-400" />{s.phone}</p>}
                {s.contact_person && <p className="text-sm flex items-center gap-2 text-gray-700"><User size={14} className="text-gray-400" />{s.contact_person}</p>}
                {s.notes && <p className="text-xs text-gray-400">{s.notes}</p>}
              </div>
            ))}
          </div>
        )}
      </Panel>

      {unlisted.length > 0 && (
        <Panel title="On your products but not in the list">
          <p className="text-sm text-gray-500 mb-3">These supplier names are typed on products. Add them so their restock orders can be emailed.</p>
          <div className="flex flex-wrap gap-2">
            {unlisted.map((u) => (
              <button
                key={u.name}
                type="button"
                onClick={() => setEditing({ name: u.name })}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-indigo-200 text-indigo-700 text-xs font-semibold hover:bg-indigo-50"
              >
                <Plus size={12} /> {u.name} <span className="text-indigo-400">({u.products})</span>
              </button>
            ))}
          </div>
        </Panel>
      )}

      {q.error && <p className="text-sm text-red-600">{error_message(q.error)}</p>}
      {editing && <SupplierDialog initial={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

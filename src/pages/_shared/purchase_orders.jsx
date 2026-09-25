import { useContext, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router";
import { CheckCircle2, ClipboardList, Mail, PackageCheck, Plus, RefreshCw, Search, Send, Trash2, Truck, X, Zap } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { AppContext } from "../../context/app_context";
import { usePurchaseOrders, useSuppliers, purchasing } from "../../hooks/use_purchasing";
import { useProducts } from "../../hooks/use_product_lookup";
import { useBranches } from "../../hooks/use_branches";
import { ROLE_PREFIX } from "../../constants/navigation";
import { date_of, peso, time_of } from "../../utils/format";
import { cn } from "../../utils/utils";

const TABS = [
  { key: "draft", label: "Needs approval", statuses: "draft" },
  { key: "sending", label: "Sending", statuses: "approved" },
  { key: "sent", label: "Sent to supplier", statuses: "sent,partially_received" },
  { key: "done", label: "Received", statuses: "received" },
  { key: "cancelled", label: "Cancelled", statuses: "cancelled" },
];

const STATUS = {
  draft: ["Needs approval", "bg-amber-100 text-amber-700"],
  approved: ["Sending…", "bg-sky-100 text-sky-700"],
  sent: ["Sent", "bg-indigo-100 text-indigo-700"],
  partially_received: ["Partly received", "bg-teal-100 text-teal-700"],
  received: ["Received", "bg-green-100 text-green-700"],
  cancelled: ["Cancelled", "bg-gray-100 text-gray-500"],
};

const SOURCE = { low_stock: "Auto · low stock", cashier_request: "Cashier request", manual: "Manual" };

// ─── One order card ──────────────────────────────────────────
const OrderCard = ({ po, is_admin, n8n }) => {
  const navigate = useNavigate();
  const { userData } = useContext(AppContext);
  const draft = po.status === "draft";
  const [lines, setLines] = useState(() => po.items.map((i) => ({ ...i })));
  const [notes, setNotes] = useState(po.notes ?? "");
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(null);
  const [msg, setMsg] = useState(null);
  const { data: products = [] } = useProducts(is_admin ? po.branch?._id : undefined, { enabled: draft });
  const { data: sup_data } = useSuppliers({ enabled: draft });
  const suppliers = (sup_data?.suppliers ?? []).filter((s) => s.name !== "Unassigned supplier");

  const dirty =
    notes !== (po.notes ?? "") ||
    lines.length !== po.items.length ||
    lines.some((l, n) => l.quantity !== po.items[n]?.quantity || Number(l.unit_cost) !== po.items[n]?.unit_cost);
  const total = lines.reduce((t, l) => t + Math.round(Number(l.unit_cost || 0) * 100) * (Number(l.quantity) || 0), 0) / 100;

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return products
      .filter((p) => !lines.some((l) => l.inventory === p._id))
      .filter((p) => p.name.toLowerCase().includes(q) || p.barcode.includes(q))
      .slice(0, 6);
  }, [query, products, lines]);

  const run = async (label, fn) => {
    setBusy(label);
    setMsg(null);
    const r = await fn();
    setBusy(null);
    if (!r.ok) setMsg({ ok: false, text: r.message, code: r.code });
    return r;
  };

  const save = () =>
    run("save", () =>
      purchasing.update_order(po._id, {
        notes,
        items: po.items.map((orig) => {
          const l = lines.find((x) => x.inventory === orig.inventory);
          return { inventory: orig.inventory, quantity: l ? Number(l.quantity) || 0 : 0, unit_cost: l ? Number(l.unit_cost) || 0 : orig.unit_cost };
        }),
      }),
    );

  const approve = async () => {
    if (dirty) {
      const s = await save();
      if (!s.ok) return;
    }
    const r = await run("approve", () => purchasing.approve(po._id));
    if (r.ok) {
      setMsg({
        ok: r.data.delivery?.ok,
        text: r.data.delivery?.ok
          ? r.data.delivery.via === "n8n"
            ? "Approved — n8n is emailing the supplier."
            : `Approved and emailed to ${r.data.order.sent_to}.`
          : `Approved, but sending failed: ${r.data.delivery?.error}. Use Resend.`,
      });
    }
  };

  const [label, tone] = STATUS[po.status] ?? [po.status, "bg-gray-100"];
  const prefix = ROLE_PREFIX[userData?.role] ?? "/branch_manager";

  return (
    <section className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 px-5 py-4 border-b border-gray-100">
        <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600"><Truck size={18} /></span>
        <div className="min-w-0">
          <p className="font-bold text-gray-900">{po.supplier?.name ?? po.supplier_name}</p>
          <p className="text-xs text-gray-400">
            {po.po_number} · {SOURCE[po.source] ?? po.source}
            {is_admin && po.branch?.name ? ` · ${po.branch.name}` : ""} · {date_of(po.createdAt, { month: "short", day: "numeric" })}
          </p>
        </div>
        <span className={cn("ml-auto text-xs font-semibold px-2.5 py-1 rounded-full", tone)}>{label}</span>
      </div>

      <div className="px-5 py-4 space-y-3">
        {draft && (!po.supplier?.email || po.supplier_name === "Unassigned supplier") && (
          <div className="text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 flex flex-wrap items-center gap-2">
            <span>
              {po.supplier_name === "Unassigned supplier"
                ? "Choose who to order these from:"
                : <>{po.supplier_name} has no email yet. Pick another supplier or <Link to={`${prefix}/suppliers`} className="font-semibold underline">add their email</Link>:</>}
            </span>
            <select
              aria-label="Supplier for this order"
              value=""
              disabled={!!busy}
              onChange={(e) => e.target.value && run("supplier", () => purchasing.update_order(po._id, { supplier_id: e.target.value }))}
              className="px-2 py-1 text-xs border border-amber-300 rounded-md bg-white"
            >
              <option value="">Choose supplier…</option>
              {suppliers.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}{s.email ? "" : " (no email)"}
                </option>
              ))}
            </select>
            <Link to={`${prefix}/suppliers`} className="font-semibold underline">New supplier</Link>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full min-w-[520px] text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 uppercase tracking-wide border-b border-gray-100">
                <th className="py-2 font-medium">Item</th>
                <th className="py-2 font-medium w-24">Qty</th>
                <th className="py-2 font-medium w-28">Unit cost</th>
                {!draft && <th className="py-2 font-medium">Received</th>}
                <th className="py-2 font-medium text-right">Total</th>
                {draft && <th className="py-2" />}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {lines.map((l) => (
                <tr key={l.inventory}>
                  <td className="py-2">
                    <p className="font-medium text-gray-900">{l.name}</p>
                    <p className="text-xs text-gray-400">{SOURCE[l.reason] ?? ""}</p>
                  </td>
                  <td className="py-2">
                    {draft ? (
                      <input type="number" min={1} step={1} aria-label={`Quantity of ${l.name}`} value={l.quantity}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.inventory === l.inventory ? { ...x, quantity: e.target.value === "" ? "" : Math.max(0, Math.floor(Number(e.target.value))) } : x)))}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded-md" />
                    ) : (
                      `${l.quantity} ${l.unit ?? ""}`
                    )}
                  </td>
                  <td className="py-2">
                    {draft ? (
                      <input type="number" min={0} step="0.01" aria-label={`Unit cost of ${l.name}`} value={l.unit_cost}
                        onChange={(e) => setLines((ls) => ls.map((x) => (x.inventory === l.inventory ? { ...x, unit_cost: e.target.value } : x)))}
                        className="w-24 px-2 py-1.5 border border-gray-200 rounded-md" />
                    ) : (
                      peso(l.unit_cost)
                    )}
                  </td>
                  {!draft && <td className="py-2 text-gray-600">{l.received_qty ?? 0} / {l.quantity}</td>}
                  <td className="py-2 text-right tabular-nums">{peso(Number(l.unit_cost || 0) * (Number(l.quantity) || 0))}</td>
                  {draft && (
                    <td className="py-2 text-right">
                      <button type="button" aria-label={`Remove ${l.name}`} onClick={() => setLines((ls) => ls.filter((x) => x.inventory !== l.inventory))} className="p-1.5 text-gray-400 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {draft && (
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Add another product to this order" aria-label="Add product" className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg" />
            {matches.length > 0 && (
              <ul className="absolute z-20 mt-1 w-full bg-white border border-gray-100 rounded-xl shadow-lg">
                {matches.map((p) => (
                  <li key={p._id}>
                    <button type="button" className="w-full text-left px-3 py-2 text-sm hover:bg-indigo-50 flex justify-between"
                      onClick={async () => {
                        setQuery("");
                        await run("add", () => purchasing.update_order(po._id, { add: [{ inventory_id: p._id, quantity: 1 }] }));
                      }}>
                      <span>{p.name}</span>
                      <span className="text-xs text-gray-400">{p.stock_management.current_stock} in stock</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {draft ? (
          <textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Note to the supplier (optional) — e.g. deliver before Friday" aria-label="Note to supplier" className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg" />
        ) : (
          po.notes && <p className="text-sm text-gray-500">Note: {po.notes}</p>
        )}

        {!draft && (
          <div className="text-xs text-gray-500 space-y-0.5">
            {po.approved_by_name && <p>Approved by {po.approved_by_name} · {date_of(po.approved_at, { month: "short", day: "numeric" })} {time_of(po.approved_at)}</p>}
            {po.sent_at && <p className="flex items-center gap-1"><Mail size={12} /> Emailed to {po.sent_to} via {po.sent_via === "n8n" ? "n8n" : "email"} · {time_of(po.sent_at)}</p>}
            {po.status === "approved" && !po.send_error && <p className="text-sky-700">Waiting for n8n to confirm the email was sent…</p>}
            {po.send_error && <p className="text-red-600">⚠ {po.send_error}</p>}
            {po.cancelled_by_name && <p>Cancelled by {po.cancelled_by_name}</p>}
          </div>
        )}

        {msg && <p className={cn("text-xs rounded-lg px-3 py-2", msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600")}>{msg.text}</p>}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-gray-100">
          <span className="text-sm text-gray-500 pt-3">
            {lines.length} item(s) · <span className="font-bold text-gray-900">{peso(draft ? total : po.total_cost)}</span>
          </span>
          <div className="ml-auto flex flex-wrap gap-2 pt-3">
            {["draft", "approved", "sent"].includes(po.status) && (
              <button type="button" disabled={!!busy} onClick={() => window.confirm(`Cancel ${po.po_number}?`) && run("cancel", () => purchasing.cancel(po._id))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 flex items-center gap-1.5">
                <X size={14} /> Cancel order
              </button>
            )}
            {draft && dirty && (
              <button type="button" disabled={!!busy} onClick={save} className="px-3 py-2 rounded-lg border border-indigo-200 text-indigo-700 text-sm font-semibold">
                {busy === "save" ? "Saving..." : "Save changes"}
              </button>
            )}
            {draft && (
              <button type="button" disabled={!!busy || lines.length === 0} onClick={approve} className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm font-semibold flex items-center gap-1.5 disabled:opacity-50">
                <Send size={14} /> {busy === "approve" ? "Sending..." : `Approve & ${n8n ? "send via n8n" : "email supplier"}`}
              </button>
            )}
            {["approved", "sent"].includes(po.status) && (
              <button type="button" disabled={!!busy} onClick={() => run("resend", () => purchasing.resend(po._id))} className="px-3 py-2 rounded-lg border border-gray-200 text-sm flex items-center gap-1.5">
                <RefreshCw size={14} /> {busy === "resend" ? "Sending..." : "Resend"}
              </button>
            )}
            {["approved", "sent", "partially_received"].includes(po.status) && (
              <button type="button" onClick={() => navigate(`${prefix}/receiving`, { state: { purchase_order: po } })} className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold flex items-center gap-1.5">
                <PackageCheck size={14} /> Receive delivery
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

// ─── New manual order ────────────────────────────────────────
const NewOrder = ({ is_admin, onDone }) => {
  const suppliers = useSuppliers().data?.suppliers ?? [];
  const branches = useBranches({ enabled: is_admin });
  const [supplier, setSupplier] = useState("");
  const [branch, setBranch] = useState("");
  const [error, setError] = useState(null);
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="text-xs text-gray-500 flex flex-col gap-1">
        Supplier
        <select value={supplier} onChange={(e) => setSupplier(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white min-w-48">
          <option value="">Choose…</option>
          {suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
        </select>
      </label>
      {is_admin && (
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Branch
          <select value={branch} onChange={(e) => setBranch(e.target.value)} className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white">
            <option value="">Choose…</option>
            {branches.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
          </select>
        </label>
      )}
      <button type="button" disabled={!supplier || (is_admin && !branch)}
        onClick={async () => {
          const r = await purchasing.create_order({ supplier_id: supplier, branch: is_admin ? branch : undefined });
          if (!r.ok) return setError(r.message);
          onDone();
        }}
        className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50">
        Create draft
      </button>
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
};

export default function PurchaseOrders() {
  const { userData } = useContext(AppContext);
  const is_admin = userData?.role === "admin";
  const [tab, setTab] = useState("draft");
  const [creating, setCreating] = useState(false);
  const current = TABS.find((t) => t.key === tab);
  const q = usePurchaseOrders(current.statuses);
  const orders = q.data?.orders ?? [];
  const n8n = !!q.data?.n8n;
  const unordered = q.data?.unordered_low_stock ?? [];
  const [adding, setAdding] = useState(null);
  const add_low = async () => {
    setAdding("busy");
    const r = await purchasing.add_low_stock();
    setAdding(r.ok ? r.data.message : r.message);
    setTab("draft");
  };

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Purchase Orders" subtitle="Restock orders to suppliers. Low stock is added automatically — you approve, and it's emailed." />

      <div className={cn("flex flex-wrap items-center gap-2 text-sm rounded-xl px-4 py-2.5 border", n8n ? "bg-green-50 border-green-100 text-green-800" : "bg-gray-50 border-gray-200 text-gray-600")}>
        {n8n ? <Zap size={16} /> : <Mail size={16} />}
        {n8n ? "Automation on: approved orders are sent through your n8n workflow." : "Approved orders are emailed directly to suppliers. Connect n8n to automate more."}
      </div>

      {unordered.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 text-sm text-amber-800 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5">
          <span>
            <b>{unordered.length}</b> low-stock item(s) aren't on any order yet:{" "}
            {unordered.slice(0, 4).map((i) => i.name).join(", ")}
            {unordered.length > 4 ? "…" : ""}
          </span>
          <button
            type="button"
            onClick={add_low}
            disabled={adding === "busy"}
            className="ml-auto px-3 py-1.5 rounded-lg bg-amber-600 text-white text-xs font-semibold disabled:opacity-50"
          >
            {adding === "busy" ? "Adding..." : "Add them to orders"}
          </button>
        </div>
      )}
      {adding && adding !== "busy" && <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-2">{adding}</p>}

      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button key={t.key} type="button" onClick={() => setTab(t.key)}
            className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border", tab === t.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}>
            {t.label}
          </button>
        ))}
        <button type="button" onClick={() => setCreating((v) => !v)} className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-indigo-200 text-indigo-700 text-xs font-semibold">
          <Plus size={14} /> New order
        </button>
      </div>

      {creating && (
        <Panel title="New restock order">
          <NewOrder is_admin={is_admin} onDone={() => { setCreating(false); setTab("draft"); }} />
        </Panel>
      )}

      {q.isPending ? (
        <Panel><Skeleton rows={4} /></Panel>
      ) : orders.length === 0 ? (
        <Panel>
          <EmptyState>
            {tab === "draft" ? (
              <span className="inline-flex items-center gap-1.5"><CheckCircle2 size={14} /> Nothing waiting. Items are added here automatically when stock runs low.</span>
            ) : (
              <span className="inline-flex items-center gap-1.5"><ClipboardList size={14} /> No orders here.</span>
            )}
          </EmptyState>
        </Panel>
      ) : (
        <div className="space-y-4">
          {orders.map((po) => (
            // key includes updatedAt so edits from the server reset the card
            <OrderCard key={`${po._id}-${po.updatedAt}`} po={po} is_admin={is_admin} n8n={n8n} />
          ))}
        </div>
      )}
    </div>
  );
}

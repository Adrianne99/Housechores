import { useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import axios from "axios";
import { AlertTriangle, Camera, Check, FileText, ImageUp, Plus, ScanLine, Trash2, X } from "lucide-react";
import { error_message, queryClient } from "../lib/query";
import { is_qty, peso } from "../utils/format";
import { cn } from "../utils/utils";
import { AUTO_MATCH, markup_of, match_products, parse_receipt, suggest_price } from "../utils/receipt";

const c = (n) => Math.round(Number(n || 0) * 100);
const DEFAULT_MARKUP = 20;
const UNITS = ["pc", "pack", "can", "bottle", "sachet", "box", "kg", "g", "L", "mL", "dozen", "bar", "roll"];

// Grayscale + contrast stretch + sensible size: thermal receipts read
// much better after this. Returns a canvas Tesseract can use directly.
const prepare_image = async (file) => {
  const bitmap = await createImageBitmap(file);
  const longest = Math.max(bitmap.width, bitmap.height);
  const scale = longest > 2200 ? 2200 / longest : longest < 1000 ? 2 : 1;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close?.();
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  const hist = new Uint32Array(256);
  for (let i = 0; i < d.length; i += 4) {
    const g = Math.round(d[i] * 0.299 + d[i + 1] * 0.587 + d[i + 2] * 0.114);
    d[i] = g;
    hist[g]++;
  }
  // Ignore the darkest/lightest 2% so shadows and glare don't flatten it.
  const total = d.length / 4;
  let lo = 0, hi = 255, acc = 0;
  while (lo < 255 && (acc += hist[lo]) < total * 0.02) lo++;
  acc = 0;
  while (hi > 0 && (acc += hist[hi]) < total * 0.02) hi--;
  const range = Math.max(1, hi - lo);
  for (let i = 0; i < d.length; i += 4) {
    const v = Math.max(0, Math.min(255, ((d[i] - lo) * 255) / range));
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
  return canvas;
};

const title_case = (s) => s.toLowerCase().replace(/\b[a-z]/g, (m) => m.toUpperCase());

// One row per receipt line, with its product match and price decision.
const make_row = (line, products, n) => {
  const [best] = match_products(line.receipt_name, products, 1);
  const product = best && best.score >= AUTO_MATCH ? best.product : null;
  return {
    id: `r${n}`,
    include: true,
    receipt_name: line.receipt_name,
    quantity: line.quantity,
    unit_cost: line.unit_cost,
    confidence: line.confidence,
    inventory_id: product?._id ?? "",
    score: product ? best.score : 0,
    price_mode: null, // null = default for the situation
    custom_price: "",
    new_product: null, // form while creating a product for this line
  };
};

// Default price choice: follow a cost increase, keep the price on a drop.
const pricing_for = (row, product) => {
  if (!product) return null;
  // Compare with what the supplier charged last time (cost_per_unit is
  // the average cost of the stock on hand).
  const old_cost = product.pricing.last_cost ?? product.pricing.cost_per_unit;
  const old_price = product.pricing.selling_price;
  if (c(row.unit_cost) === c(old_cost) || !(Number(row.unit_cost) > 0)) return null;
  const suggested = suggest_price(row.unit_cost, product.pricing.markup_value);
  const mode = row.price_mode ?? (c(row.unit_cost) > c(old_cost) && c(suggested) !== c(old_price) ? "suggested" : "keep");
  const price = mode === "suggested" ? suggested : mode === "custom" ? Number(row.custom_price) || null : null;
  return { old_cost, old_price, suggested, mode, price, markup: product.pricing.markup_value, up: c(row.unit_cost) > c(old_cost) };
};

// ─── New product mini-form ───────────────────────────────────
const NewProductForm = ({ row, categories, branch, onCreated, onCancel }) => {
  const words = title_case(row.receipt_name).split(" ");
  const [f, setF] = useState(() => ({
    name: title_case(row.receipt_name),
    brand: words[0] ?? "",
    category: "",
    unit: "pc",
    barcode: "",
    markup: DEFAULT_MARKUP,
    price: suggest_price(row.unit_cost, DEFAULT_MARKUP),
  }));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const set = (k) => (e) =>
    setF((p) => {
      const next = { ...p, [k]: e.target.value };
      if (k === "markup") next.price = suggest_price(row.unit_cost, e.target.value);
      return next;
    });

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const cost = Number(row.unit_cost) || 0;
      const price = Number(f.price) || 0;
      const { data } = await axios.post("/api/products/create-product", {
        // No barcode on hand? Use an internal code; scan the real one later.
        barcode: f.barcode.trim() || `RCPT-${Date.now().toString(36).toUpperCase()}`,
        name: f.name.trim(),
        brand: f.brand.trim(),
        category: f.category.trim() || "Uncategorized",
        unit: f.unit,
        branch,
        stock_management: { current_stock: 0, reorder_level: 5 },
        pricing: { cost_per_unit: cost, markup_value: markup_of(cost, price), selling_price: price },
      });
      if (!data.success) throw new Error(data.message);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onCreated(data.inventory._id, {
        _id: data.inventory._id,
        name: f.name.trim(),
        brand: f.brand.trim(),
        unit: f.unit,
        stock_management: { current_stock: 0 },
        pricing: { cost_per_unit: cost, selling_price: price, markup_value: markup_of(cost, price) },
      });
    } catch (err) {
      setError(error_message(err));
      setBusy(false);
    }
  };

  const field = "px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white";
  return (
    <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/50 p-3 space-y-2">
      <p className="text-xs font-semibold text-indigo-800">New product</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        <label className="col-span-2 text-xs text-gray-500 flex flex-col gap-1">
          Name
          <input value={f.name} onChange={set("name")} className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Brand
          <input value={f.brand} onChange={set("brand")} className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Category
          <input list="receipt-categories" value={f.category} onChange={set("category")} placeholder="e.g. Noodles" className={field} />
          <datalist id="receipt-categories">
            {categories.map((cat) => <option key={cat} value={cat} />)}
          </datalist>
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Unit
          <select value={f.unit} onChange={set("unit")} className={field}>
            {UNITS.map((u) => <option key={u}>{u}</option>)}
          </select>
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Barcode <span className="text-gray-400">(optional)</span>
          <input value={f.barcode} onChange={set("barcode")} placeholder="scan later" className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Markup %
          <input type="number" min={0} value={f.markup} onChange={set("markup")} className={field} />
        </label>
        <label className="text-xs text-gray-500 flex flex-col gap-1">
          Selling price
          <input type="number" min={0} step="0.25" value={f.price} onChange={set("price")} className={field} />
        </label>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="px-3 py-1.5 text-xs rounded-md border border-gray-200 bg-white">Cancel</button>
        <button
          type="button"
          onClick={create}
          disabled={busy || !f.name.trim() || !f.brand.trim() || !(Number(f.price) > 0)}
          className="px-3 py-1.5 text-xs rounded-md bg-indigo-600 text-white font-semibold disabled:opacity-50"
        >
          {busy ? "Adding..." : "Add product"}
        </button>
      </div>
    </div>
  );
};

/**
 * Photo of a supplier receipt → reviewed delivery lines.
 * Mounted only while open. `onApply({ supplier, reference, lines })`.
 */
export const ReceiptScanner = ({ products, branch, onApply, onClose }) => {
  const [stage, setStage] = useState("pick"); // pick | reading | review
  const [photo, setPhoto] = useState(null); // object URL for the preview
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState(null);
  const [text, setText] = useState("");
  const [showText, setShowText] = useState(false);
  const [header, setHeader] = useState({ supplier: "", reference: "" });
  const [rows, setRows] = useState([]);
  const [extra, setExtra] = useState([]); // products created during review
  const worker = useRef(null);
  const all_products = useMemo(() => [...extra, ...products], [extra, products]);
  const by_id = useMemo(() => new Map(all_products.map((p) => [p._id, p])), [all_products]);
  const sorted = useMemo(() => [...all_products].sort((a, b) => a.name.localeCompare(b.name)), [all_products]);
  const categories = useMemo(() => [...new Set(products.map((p) => p.category).filter(Boolean))].sort(), [products]);

  const close = () => {
    worker.current?.terminate();
    if (photo) URL.revokeObjectURL(photo);
    onClose();
  };

  const read = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return setError("Choose a photo (JPG or PNG).");
    if (photo) URL.revokeObjectURL(photo);
    setPhoto(URL.createObjectURL(file));
    setError(null);
    setProgress(0);
    setStage("reading");
    try {
      const [{ createWorker }, canvas] = await Promise.all([import("tesseract.js"), prepare_image(file)]);
      worker.current = await createWorker("eng", 1, {
        logger: (m) => m.status === "recognizing text" && setProgress(m.progress),
      });
      // 6 = one block of text, which suits receipts; keep column spacing.
      await worker.current.setParameters({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
      const { data } = await worker.current.recognize(canvas);
      await worker.current.terminate();
      worker.current = null;
      const parsed = parse_receipt(data.text);
      setText(data.text);
      setHeader({ supplier: parsed.supplier, reference: parsed.reference });
      setRows(parsed.lines.map((l, n) => make_row(l, products, n)));
      setStage("review");
    } catch (err) {
      worker.current = null;
      setError(`Couldn't read the photo: ${err?.message ?? err}. Check your internet (the reader downloads once) and try again.`);
      setStage("pick");
    }
  };

  const set_row = (id, patch) => setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  const add_row = () =>
    setRows((rs) => [
      ...rs,
      { id: `m${Date.now()}`, include: true, receipt_name: "", quantity: 1, unit_cost: 0, confidence: "high", inventory_id: "", score: 0, price_mode: null, custom_price: "", new_product: null },
    ]);

  const ready = rows.filter((r) => r.include && r.inventory_id);
  const unmatched = rows.filter((r) => r.include && !r.inventory_id).length;
  // Weighed products may come in kilos with decimals.
  const bad = ready.some((r) => !is_qty(r.quantity, !!by_id.get(r.inventory_id)?.sold_by_weight) || !(Number(r.unit_cost) >= 0));
  const total = Math.round(ready.reduce((t, r) => t + c(r.unit_cost) * (Number(r.quantity) || 0), 0)) / 100;

  const apply = () => {
    onApply({
      supplier: header.supplier.trim(),
      reference: header.reference.trim(),
      lines: ready.map((r) => {
        const p = by_id.get(r.inventory_id);
        const pr = pricing_for(r, p);
        return {
          inventory_id: r.inventory_id,
          name: p?.name ?? r.receipt_name,
          unit: p?.unit,
          current: p?.stock_management?.current_stock ?? null,
          quantity: Number(r.quantity),
          unit_cost: Number(r.unit_cost),
          receipt_name: r.receipt_name,
          prev_price: p?.pricing?.selling_price,
          selling_price: pr?.price && c(pr.price) !== c(pr.old_price) ? pr.price : undefined,
        };
      }),
    });
    close();
  };

  const field = "px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white";
  // Rendered on <body> so the wide dialog sits above the sidebar.
  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={stage === "reading" ? undefined : close} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Scan receipt"
        onKeyDown={(e) => e.key === "Escape" && close()}
        className="relative bg-white rounded-2xl shadow-xl w-full max-w-6xl mx-2 sm:mx-4 max-h-[94vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div>
            <p className="text-lg font-bold text-gray-900 flex items-center gap-2"><ScanLine size={18} /> Scan receipt</p>
            <p className="text-xs text-gray-500">Photo of the supplier's receipt → check each line → added to this delivery.</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"><X size={18} /></button>
        </div>

        {stage === "pick" && (
          <div className="p-6 space-y-4">
            <div className="grid sm:grid-cols-2 gap-3">
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-indigo-200 hover:border-indigo-400 bg-indigo-50/40 p-6 flex flex-col items-center gap-2 text-center">
                <Camera size={28} className="text-indigo-600" />
                <span className="font-semibold text-gray-900">Take a photo</span>
                <span className="text-xs text-gray-500">Opens the camera on phones and tablets</span>
                <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => read(e.target.files?.[0])} />
              </label>
              <label className="cursor-pointer rounded-xl border-2 border-dashed border-gray-200 hover:border-indigo-300 p-6 flex flex-col items-center gap-2 text-center">
                <ImageUp size={28} className="text-gray-500" />
                <span className="font-semibold text-gray-900">Upload a picture</span>
                <span className="text-xs text-gray-500">JPG or PNG of the receipt</span>
                <input type="file" accept="image/*" aria-label="Upload receipt picture" className="sr-only" onChange={(e) => read(e.target.files?.[0])} />
              </label>
            </div>
            <ul className="text-xs text-gray-500 list-disc pl-5 space-y-1">
              <li>Lay the receipt flat in good light; avoid shadows and folds.</li>
              <li>Fill the frame with the item lines. Long receipts: scan in two parts.</li>
              <li>Reading happens on this device — the photo isn't uploaded anywhere.</li>
            </ul>
            {error && <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
          </div>
        )}

        {stage === "reading" && (
          <div className="p-10 flex flex-col items-center gap-4">
            {photo && <img src={photo} alt="Receipt" className="max-h-56 rounded-lg border border-gray-100 object-contain" />}
            <p className="text-sm font-medium text-gray-700">Reading receipt… {Math.round(progress * 100)}%</p>
            <div className="w-64 h-2 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-indigo-500 transition-all" style={{ width: `${Math.max(5, progress * 100)}%` }} />
            </div>
            <p className="text-xs text-gray-400">The first scan downloads the reader (~5 MB); later scans are faster.</p>
          </div>
        )}

        {stage === "review" && (
          <>
            <div className="flex-1 overflow-y-auto p-5 grid lg:grid-cols-[220px_1fr] gap-5">
              <div className="space-y-3">
                {photo && (
                  <a href={photo} target="_blank" rel="noreferrer" title="Open full size">
                    <img src={photo} alt="Scanned receipt" className="w-full max-h-80 lg:max-h-[60vh] object-contain rounded-lg border border-gray-100" />
                  </a>
                )}
                <label className="text-xs text-gray-500 flex flex-col gap-1">
                  Supplier
                  <input value={header.supplier} onChange={(e) => setHeader((h) => ({ ...h, supplier: e.target.value }))} className={field} />
                </label>
                <label className="text-xs text-gray-500 flex flex-col gap-1">
                  Receipt / invoice no.
                  <input value={header.reference} onChange={(e) => setHeader((h) => ({ ...h, reference: e.target.value }))} className={field} />
                </label>
                <button type="button" onClick={() => setShowText((s) => !s)} className="text-xs text-indigo-600 flex items-center gap-1">
                  <FileText size={12} /> {showText ? "Hide" : "Show"} text read from the photo
                </button>
                {showText && <pre className="text-[11px] leading-snug whitespace-pre-wrap bg-gray-50 rounded-lg p-2 max-h-60 overflow-y-auto">{text || "(nothing)"}</pre>}
                <button type="button" onClick={() => setStage("pick")} className="text-xs text-gray-500 underline">Scan a different photo</button>
              </div>

              <div className="space-y-3 min-w-0">
                {rows.length === 0 && (
                  <p className="text-sm text-amber-800 bg-amber-50 rounded-lg px-3 py-2">
                    No item lines were found. Try a clearer photo, or add the lines by hand below.
                  </p>
                )}
                {rows.map((r) => {
                  const p = by_id.get(r.inventory_id);
                  const pr = pricing_for(r, p);
                  const candidates = match_products(r.receipt_name, all_products, 3);
                  return (
                    <div
                      key={r.id}
                      className={cn(
                        "rounded-xl border p-3 space-y-2",
                        !r.include ? "border-gray-100 opacity-50" : !r.inventory_id ? "border-amber-200 bg-amber-50/40" : r.confidence === "low" ? "border-amber-200" : "border-gray-100",
                      )}
                    >
                      <div className="flex flex-wrap items-start gap-2">
                        <input
                          type="checkbox"
                          checked={r.include}
                          onChange={(e) => set_row(r.id, { include: e.target.checked })}
                          aria-label={`Include ${r.receipt_name || "line"}`}
                          className="mt-2"
                        />
                        <div className="flex-1 min-w-[200px] space-y-1">
                          <input
                            value={r.receipt_name}
                            onChange={(e) => set_row(r.id, { receipt_name: e.target.value })}
                            aria-label="Text on receipt"
                            placeholder="Text on receipt"
                            className="w-full px-2 py-1 text-xs font-mono text-gray-600 border border-transparent hover:border-gray-200 rounded"
                          />
                          <select
                            value={r.inventory_id}
                            onChange={(e) =>
                              e.target.value === "__new"
                                ? set_row(r.id, { new_product: true })
                                : set_row(r.id, { inventory_id: e.target.value, price_mode: null, new_product: null })
                            }
                            aria-label={`Product for ${r.receipt_name}`}
                            className={cn(field, "w-full", !r.inventory_id && "border-amber-300")}
                          >
                            <option value="">— Choose product —</option>
                            {candidates.length > 0 && (
                              <optgroup label="Best matches">
                                {candidates.map((m) => (
                                  <option key={`m-${m.product._id}`} value={m.product._id}>
                                    {m.product.name} ({Math.round(m.score * 100)}%)
                                  </option>
                                ))}
                              </optgroup>
                            )}
                            <option value="__new">➕ Add as new product…</option>
                            <optgroup label="All products">
                              {sorted.map((x) => (
                                <option key={x._id} value={x._id}>{x.name}</option>
                              ))}
                            </optgroup>
                          </select>
                        </div>
                        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
                          Qty
                          <input type="number" min={0} step="any" value={r.quantity} onChange={(e) => set_row(r.id, { quantity: e.target.value })} aria-label={`Quantity for ${r.receipt_name}`} className={cn(field, "w-20")} />
                        </label>
                        <label className="text-[11px] text-gray-500 flex flex-col gap-0.5">
                          Unit cost
                          <input type="number" min={0} step="0.01" value={r.unit_cost} onChange={(e) => set_row(r.id, { unit_cost: e.target.value, price_mode: null })} aria-label={`Unit cost for ${r.receipt_name}`} className={cn(field, "w-24")} />
                        </label>
                        <div className="text-right text-sm tabular-nums pt-5 w-24">{peso((c(r.unit_cost) * (Number(r.quantity) || 0)) / 100)}</div>
                        <button type="button" onClick={() => setRows((rs) => rs.filter((x) => x.id !== r.id))} aria-label="Remove line" className="p-1.5 mt-4 text-gray-300 hover:text-red-500">
                          <Trash2 size={15} />
                        </button>
                      </div>

                      {r.include && r.confidence === "low" && (
                        <p className="text-xs text-amber-700 flex items-center gap-1"><AlertTriangle size={12} /> Couldn't read this line clearly — check the quantity and cost.</p>
                      )}
                      {r.include && !r.inventory_id && !r.new_product && (
                        <p className="text-xs text-amber-700">Not in your products yet — choose one, or pick "Add as new product".</p>
                      )}
                      {r.new_product && (
                        <NewProductForm
                          row={r}
                          categories={categories}
                          branch={branch}
                          onCancel={() => set_row(r.id, { new_product: null })}
                          onCreated={(id, product) => {
                            setExtra((x) => [product, ...x]);
                            set_row(r.id, { inventory_id: id, new_product: null });
                          }}
                        />
                      )}

                      {pr && (
                        <div className="rounded-lg bg-gray-50 px-3 py-2 text-xs space-y-1.5">
                          <p className={pr.up ? "text-red-700" : "text-green-700"}>
                            Cost {pr.up ? "went up" : "went down"}: {peso(pr.old_cost)} → <b>{peso(r.unit_cost)}</b> ({pr.up ? "+" : "−"}
                            {peso(Math.abs(Number(r.unit_cost) - pr.old_cost))})
                          </p>
                          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label={`Price for ${p.name}`}>
                            <button
                              type="button"
                              role="radio"
                              aria-checked={pr.mode === "keep"}
                              onClick={() => set_row(r.id, { price_mode: "keep" })}
                              className={cn("px-2.5 py-1 rounded-full border", pr.mode === "keep" ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold" : "border-gray-200 bg-white")}
                            >
                              Keep {peso(pr.old_price)} <span className="font-normal text-gray-400">({markup_of(r.unit_cost, pr.old_price)}% markup)</span>
                            </button>
                            {c(pr.suggested) !== c(pr.old_price) && (
                              <button
                                type="button"
                                role="radio"
                                aria-checked={pr.mode === "suggested"}
                                onClick={() => set_row(r.id, { price_mode: "suggested" })}
                                className={cn("px-2.5 py-1 rounded-full border", pr.mode === "suggested" ? "border-indigo-500 bg-indigo-50 text-indigo-700 font-semibold" : "border-gray-200 bg-white")}
                              >
                                Change to {peso(pr.suggested)} <span className="font-normal text-gray-400">(keeps {pr.markup}%)</span>
                              </button>
                            )}
                            <span className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border", pr.mode === "custom" ? "border-indigo-500 bg-indigo-50" : "border-gray-200 bg-white")}>
                              Other ₱
                              <input
                                type="number"
                                min={0}
                                step="0.25"
                                value={r.custom_price}
                                onFocus={() => set_row(r.id, { price_mode: "custom" })}
                                onChange={(e) => set_row(r.id, { price_mode: "custom", custom_price: e.target.value })}
                                aria-label={`Custom price for ${p.name}`}
                                className="w-16 bg-transparent outline-none"
                              />
                            </span>
                          </div>
                          {pr.price && Number(pr.price) < Number(r.unit_cost) && (
                            <p className="text-red-600">This price is below the new cost — you'd lose money on each sale.</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
                <button type="button" onClick={add_row} className="flex items-center gap-1.5 text-sm text-indigo-600 font-medium">
                  <Plus size={14} /> Add a line by hand
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-3 px-5 py-4 border-t border-gray-100">
              {unmatched > 0 && <span className="text-xs text-amber-700 mr-auto">{unmatched} line(s) still need a product — they'll be left out.</span>}
              <span className="text-sm text-gray-500">
                {ready.length} item(s) · <b className="text-gray-900">{peso(total)}</b>
              </span>
              <button type="button" onClick={close} className="px-4 py-2 rounded-lg border border-gray-200 text-sm">Cancel</button>
              <button
                type="button"
                onClick={apply}
                disabled={ready.length === 0 || bad}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                <Check size={16} /> Add {ready.length} item(s) to delivery
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
};

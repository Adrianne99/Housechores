import { useState, useCallback, useMemo, useRef } from "react";
import { compute_totals, line_subtotal } from "../utils/pricing";

// Quantity edits within this window count as one change, so typing "12"
// over "5" isn't reported as removing 4 and adding 11.
const DECREASE_SETTLE_MS = 1500;

const round_qty = (n) => Math.round(Number(n) * 1000) / 1000;

// A cart line is one of:
//   piece  — key = inventory id
//   pack   — key = "<inventory>:<pack>", units_per pieces each
//   weight — key = "<inventory>:w:<n>", quantity in kilos; one line per
//            weighing. `amount` is set for "₱20 worth" lines.
//   custom — key = "custom-…" (manager-typed name and price)

// Line value: a "₱20 worth" line is exactly its amount.
export const line_total = (i) => (i.amount != null ? i.amount : line_subtotal(i.unit_price, i.quantity));
const subtotal_of = (items) => items.reduce((sum, i) => sum + line_total(i), 0);
// Stock units a line takes (a pack of 20 takes 20).
export const units_of = (i) => round_qty(i.quantity * (i.units_per ?? 1));

// Most of `line` that fits in stock next to the product's other lines
// (pieces and packs share one stock).
const max_qty = (items, line) => {
  if (line.is_custom || !Number.isFinite(line.available_stock)) return Infinity;
  const others = items
    .filter((i) => !i.is_custom && i.inventory_id === line.inventory_id && i.key !== line.key)
    .reduce((t, i) => t + units_of(i), 0);
  const free = line.available_stock - others;
  return line.by_weight ? round_qty(free) : Math.floor(free / (line.units_per ?? 1));
};

let weigh_seq = 0;
const line_from = (product, pack, quantity, amount) => ({
  key: pack
    ? `${product._id}:${pack._id}`
    : product.sold_by_weight
      ? `${product._id}:w:${Date.now().toString(36)}${++weigh_seq}`
      : product._id,
  inventory_id: product._id,
  pack_id: pack?._id ?? null,
  units_per: pack?.quantity ?? 1,
  by_weight: !!product.sold_by_weight,
  amount,
  is_custom: false,
  barcode: pack?.barcode || product.barcode,
  name: pack ? `${product.name} (${pack.name} of ${pack.quantity})` : product.name,
  brand: product.brand,
  unit: pack ? pack.name : product.unit,
  unit_price: pack ? pack.selling_price : product.pricing.selling_price,
  quantity,
  available_stock: product.stock_management.current_stock,
});

const removed_line = (line, quantity) => ({
  inventory_id: line.is_custom ? undefined : line.inventory_id,
  pack_id: line.pack_id || undefined,
  name: line.name,
  unit_price: line.unit_price,
  quantity,
});

// Forget a settling decrease; returns the quantity the line had before it.
const take_pending = (map, key) => {
  const p = map.get(key);
  if (!p) return undefined;
  clearTimeout(p.timer);
  map.delete(key);
  return p.from;
};

// onRemoved({ kind, items, cart_total, after_total_shown }) is called when
// items leave the cart without being sold (trash, lower quantity, clear).
export const useCart = ({ onRemoved } = {}) => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(null);
  // discount shape: { type, value, id_number, reason, amount, vat_exempt }
  // Has the customer been shown the total (Charge opened) for this cart?
  const [totalShown, setTotalShown] = useState(false);
  // line key → { from, cart_total, timer } for quantity drops still settling.
  const pending = useRef(new Map());

  const report = useCallback(
    (kind, lines, cart_total) => {
      if (lines.length) onRemoved?.({ kind, items: lines, cart_total, after_total_shown: totalShown });
    },
    [onRemoved, totalShown],
  );

  // ─── Add a piece or a pack ───────────────────────────────
  const addItem = useCallback((product, pack = null) => {
    setItems((prev) => {
      const key = pack ? `${product._id}:${pack._id}` : product._id;
      const existing = prev.find((i) => i.key === key);
      if (existing) {
        if (existing.quantity + 1 > max_qty(prev, existing)) return prev;
        return prev.map((i) => (i.key === key ? { ...i, quantity: i.quantity + 1 } : i));
      }
      const line = line_from(product, pack, 1);
      if (max_qty(prev, line) < 1) return prev;
      return [...prev, line];
    });
  }, []);

  // ─── Add a weighed item: { kg } or { amount } (₱ worth) ──
  // Returns null when added, or why it couldn't be.
  const addWeighed = useCallback(
    (product, { kg, amount }) => {
      const price = product.pricing.selling_price;
      const peso_amount = amount != null ? Math.round(Number(amount) * 100) / 100 : undefined;
      const quantity = peso_amount != null ? (price > 0 ? round_qty(peso_amount / price) : 0) : round_qty(kg);
      if (!(quantity > 0)) return "Enter a weight or amount above 0.";
      const line = line_from(product, null, quantity, peso_amount);
      const max = max_qty(items, line);
      if (quantity > max) return `Only ${Math.max(0, max)} ${product.unit || "kg"} left.`;
      setItems((prev) => [...prev, line]);
      return null;
    },
    [items],
  );

  // ─── Add custom item ──────────────────────────────────
  const addCustomItem = useCallback(
    ({ name, brand, unit, unit_price, quantity }) => {
      if (!name?.trim() || !Number.isFinite(Number(unit_price))) return false;
      const qty = Math.max(1, Math.floor(Number(quantity)) || 1);
      const key = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

      setItems((prev) => [
        ...prev,
        {
          key,
          inventory_id: key,
          is_custom: true,
          units_per: 1,
          name: name.trim(),
          brand: brand?.trim() ?? "",
          unit: unit?.trim() ?? "",
          unit_price: +Number(unit_price).toFixed(2),
          quantity: qty,
          available_stock: Infinity,
        },
      ]);
      return true;
    },
    [],
  );

  const removeItem = useCallback(
    (key) => {
      const line = items.find((i) => i.key === key);
      if (!line) return;
      const before = take_pending(pending.current, key);
      report("remove", [removed_line(line, before ?? line.quantity)], subtotal_of(items));
      setItems((prev) => prev.filter((i) => i.key !== key));
    },
    [items, report],
  );

  // Whole units, or kilos to the gram for weighed lines. A blank/invalid
  // entry is ignored (the line stays); use the remove button — or type 0
  // on a whole-unit line — to delete a line.
  const updateQuantity = useCallback(
    (key, quantity) => {
      if (quantity === "" || quantity === null || quantity === undefined) return;
      const line = items.find((i) => i.key === key);
      if (!line) return;
      const qty = line.by_weight ? round_qty(quantity) : Math.floor(Number(quantity));
      if (!Number.isFinite(qty) || qty < 0) return;
      // Typing "0.25" passes through "0" — only whole-unit lines delete on 0.
      if (qty === 0) return line.by_weight ? undefined : removeItem(key);
      const next = Math.min(qty, max_qty(items, line));
      if (next === line.quantity || next <= 0) return;

      // Track drops until the edits settle, then report the net decrease.
      const p = pending.current.get(key);
      if (p) clearTimeout(p.timer);
      if (p || next < line.quantity) {
        const from = p?.from ?? line.quantity;
        const cart_total = p?.cart_total ?? subtotal_of(items);
        const timer = setTimeout(() => {
          pending.current.delete(key);
          if (next < from) report("decrease", [removed_line(line, round_qty(from - next))], cart_total);
        }, DECREASE_SETTLE_MS);
        pending.current.set(key, { from, cart_total, timer });
      }
      // A typed weight replaces a "₱ worth" amount.
      setItems((prev) => prev.map((i) => (i.key === key ? { ...i, quantity: next, amount: undefined } : i)));
    },
    [items, removeItem, report],
  );

  // Empties the cart after a sale or hold — nothing was taken back.
  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(null);
    setTotalShown(false);
  }, []);

  // Empties the cart WITHOUT selling it (Clear, switching branch, replacing
  // it with a held order) — reported like any other removal.
  const discardCart = useCallback(() => {
    const lines = items.map((i) => removed_line(i, take_pending(pending.current, i.key) ?? i.quantity));
    report("clear", lines, subtotal_of(items));
    clearCart();
  }, [items, report, clearCart]);

  const markTotalShown = useCallback(() => setTotalShown(true), []);
  const applyDiscount = useCallback((d) => setDiscount(d), []);
  const clearDiscount = useCallback(() => setDiscount(null), []);

  // ─── Load held order into the cart ──────────────────────
  const loadFromHeld = useCallback((held_items) => {
    const mapped = held_items.map((h, n) => {
      const key = h.is_custom
        ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        : h.pack_id
          ? `${h.inventory}:${h.pack_id}`
          : h.by_weight
            ? `${h.inventory}:w:${Date.now().toString(36)}${n}`
            : h.inventory;
      return {
        key,
        inventory_id: h.is_custom ? key : h.inventory,
        is_custom: h.is_custom,
        pack_id: h.pack_id ?? null,
        units_per: h.units_per ?? 1,
        by_weight: !!h.by_weight,
        barcode: h.product_snapshot?.barcode,
        name: h.product_snapshot?.name,
        brand: h.product_snapshot?.brand,
        unit: h.pack_name ?? h.product_snapshot?.unit,
        unit_price: h.unit_price,
        quantity: h.quantity,
        available_stock: h.available_stock ?? Infinity,
      };
    });
    setItems(mapped);
    setDiscount(null);
    setTotalShown(false);
  }, []);

  // ─── Totals (with discount) ─────────────────────────────
  // Same math the server uses (utils/pricing.js), so the total shown here
  // matches what gets charged. Senior/PWD: subtotal / 1.12 × 0.8, VAT-exempt.
  const totals = useMemo(() => {
    const subtotal = subtotal_of(items);
    // A weighed line counts as one item, not 0.385 of one.
    const item_count = items.reduce((sum, i) => sum + (i.by_weight ? 1 : i.quantity), 0);
    return { ...compute_totals(subtotal, discount), item_count };
  }, [items, discount]);

  return {
    items,
    discount,
    addItem,
    addWeighed,
    addCustomItem,
    updateQuantity,
    removeItem,
    clearCart,
    discardCart,
    markTotalShown,
    applyDiscount,
    clearDiscount,
    loadFromHeld,
    totals,
    isEmpty: items.length === 0,
  };
};

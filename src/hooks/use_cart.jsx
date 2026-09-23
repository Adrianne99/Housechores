import { useState, useCallback, useMemo } from "react";
import { compute_totals, line_subtotal } from "../utils/pricing";

export const useCart = () => {
  const [items, setItems] = useState([]);
  const [discount, setDiscount] = useState(null);
  // discount shape: { type, value, id_number, reason, amount, vat_exempt }

  // ─── Add inventory item ──────────────────────────────────
  const addItem = useCallback((product) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.inventory_id === product._id);
      if (existing) {
        if (existing.quantity + 1 > existing.available_stock) return prev;
        return prev.map((i) =>
          i.inventory_id === product._id
            ? { ...i, quantity: i.quantity + 1 }
            : i,
        );
      }
      if (product.stock_management.current_stock < 1) return prev;

      return [
        ...prev,
        {
          inventory_id: product._id,
          is_custom: false,
          barcode: product.barcode,
          name: product.name,
          brand: product.brand,
          unit: product.unit,
          unit_price: product.pricing.selling_price,
          quantity: 1,
          available_stock: product.stock_management.current_stock,
        },
      ];
    });
  }, []);

  // ─── Add custom item ──────────────────────────────────
  const addCustomItem = useCallback(
    ({ name, brand, unit, unit_price, quantity }) => {
      if (!name?.trim() || !Number.isFinite(Number(unit_price))) return false;
      const qty = Math.max(1, Math.floor(Number(quantity)) || 1);

      setItems((prev) => [
        ...prev,
        {
          inventory_id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          is_custom: true,
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

  // Whole units only. A blank/invalid entry is ignored (the line stays);
  // use the remove button — or type 0 — to delete a line.
  const updateQuantity = useCallback((inventory_id, quantity) => {
    if (quantity === "" || quantity === null || quantity === undefined) return;
    const qty = Math.floor(Number(quantity));
    if (!Number.isFinite(qty) || qty < 0) return;
    setItems((prev) => {
      if (qty === 0) return prev.filter((i) => i.inventory_id !== inventory_id);
      return prev.map((i) =>
        i.inventory_id === inventory_id
          ? { ...i, quantity: Math.min(qty, i.available_stock) }
          : i,
      );
    });
  }, []);

  const removeItem = useCallback((inventory_id) => {
    setItems((prev) => prev.filter((i) => i.inventory_id !== inventory_id));
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
    setDiscount(null);
  }, []);

  const applyDiscount = useCallback((d) => setDiscount(d), []);
  const clearDiscount = useCallback(() => setDiscount(null), []);

  // ─── Load held order into the cart ──────────────────────
  const loadFromHeld = useCallback((held_items) => {
    const mapped = held_items.map((h) => ({
      inventory_id: h.is_custom
        ? `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
        : h.inventory,
      is_custom: h.is_custom,
      barcode: h.product_snapshot?.barcode,
      name: h.product_snapshot?.name,
      brand: h.product_snapshot?.brand,
      unit: h.product_snapshot?.unit,
      unit_price: h.unit_price,
      quantity: h.quantity,
      available_stock: h.available_stock ?? Infinity,
    }));
    setItems(mapped);
    setDiscount(null);
  }, []);

  // ─── Totals (with discount) ─────────────────────────────
  // Same math the server uses (utils/pricing.js), so the total shown here
  // matches what gets charged. Senior/PWD: subtotal / 1.12 × 0.8, VAT-exempt.
  const totals = useMemo(() => {
    const subtotal = items.reduce(
      (sum, i) => sum + line_subtotal(i.unit_price, i.quantity),
      0,
    );
    const item_count = items.reduce((sum, i) => sum + i.quantity, 0);
    return { ...compute_totals(subtotal, discount), item_count };
  }, [items, discount]);

  return {
    items,
    discount,
    addItem,
    addCustomItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    clearDiscount,
    loadFromHeld,
    totals,
    isEmpty: items.length === 0,
  };
};

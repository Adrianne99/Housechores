// Display helpers shared by the dashboard, reports and notifications.

export const peso = (n) =>
  `₱${Number(n ?? 0).toLocaleString("en-PH", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const num = (n) => Number(n ?? 0).toLocaleString("en-PH");

// Quantities: whole units, or kilos to the gram (no float noise).
export const round_qty = (n) => Math.round(Number(n ?? 0) * 1000) / 1000;
// Valid quantity: whole units, or kilos to the gram when by_weight.
// zero: allow 0 (stock counts).
export const is_qty = (n, by_weight = false, zero = false) => {
  const q = Number(n);
  if (n === "" || n === null || n === undefined || !Number.isFinite(q) || (zero ? q < 0 : q <= 0)) return false;
  return by_weight ? round_qty(q) === q : Number.isInteger(q);
};
// What a typed quantity counts as (0 if not valid yet).
export const qty_value = (n, by_weight = false) => (is_qty(n, by_weight) ? Number(n) : 0);
// "3", or "0.385 kg" for a line sold by weight.
export const qty_label = (item) =>
  item?.by_weight ? `${round_qty(item.quantity)} ${item.product_snapshot?.unit || item.unit || "kg"}` : String(round_qty(item?.quantity));

export const ROLE_LABELS = {
  admin: "Administrator",
  branch_manager: "Branch Manager",
  employee: "Cashier",
};

export const initials = (name = "") =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("") || "?";

// Short staff code shown on the profile, e.g. "EMP-3F9A2C".
export const staff_code = (user) =>
  user?._id
    ? `${user.role === "employee" ? "EMP" : user.role === "branch_manager" ? "MGR" : "ADM"}-${String(
        user._id,
      )
        .slice(-6)
        .toUpperCase()}`
    : "—";

export const time_of = (d) =>
  d
    ? new Date(d).toLocaleTimeString("en-PH", { hour: "numeric", minute: "2-digit" })
    : "—";

export const date_of = (d, opts = { month: "short", day: "numeric", year: "numeric" }) =>
  d ? new Date(d).toLocaleDateString("en-PH", opts) : "—";

// "HH:MM" (24h) → "8:00 AM"
export const clock_label = (hhmm) => {
  if (!hhmm) return "—";
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return time_of(d);
};

export const hours_label = (h) => {
  const total = Math.round((h ?? 0) * 60);
  return `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, "0")}m`;
};

export const time_ago = (d) => {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return date_of(d, { month: "short", day: "numeric" });
};

// Today's date in the business timezone, "YYYY-MM-DD"
export const today_local = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila" }).format(new Date());

// Payment methods: the store's list (store settings) holds labels; orders
// store the key ("Bank Transfer" → "bank_transfer"). Same rule as the backend.
export const DEFAULT_PAYMENT_METHODS = ["Cash", "GCash", "Maya", "Bank Transfer", "Card"];
export const method_key = (label) =>
  String(label).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
export const method_label = (key, labels = []) =>
  [...labels, ...DEFAULT_PAYMENT_METHODS].find((l) => method_key(l) === key) ??
  String(key ?? "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

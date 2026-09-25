// Turns OCR text from a supplier receipt into delivery lines, matches
// them to products and suggests shelf prices. Pure functions only (no
// React, no network) so they can be tested on their own.

// ─── Prices ──────────────────────────────────────────────────
const cents = (n) => Math.round(Number(n || 0) * 100);

// Up to the next ₱0.25 so the markup is never cut: 12.60 → 12.75.
export const round_up_quarter = (n) => Math.ceil(cents(n) / 25) * 25 / 100;

// New shelf price that keeps the product's markup on the new cost.
export const suggest_price = (cost, markup_percent) =>
  round_up_quarter(Number(cost) * (1 + (Number(markup_percent) || 0) / 100));

// Margin as a % of cost (the app's "markup").
export const markup_of = (cost, price) =>
  Number(cost) > 0 ? Math.round(((Number(price) - Number(cost)) / Number(cost)) * 1000) / 10 : 0;

// ─── Text → lines ────────────────────────────────────────────
// Lines that are totals, payment or header details, not items.
const SKIP =
  /\b(sub\s*-?\s*total|total|vat|vatable|non-?vat|zero\s*rated|tax|cash|change|amount\s*due|balance|tin|date|time|cashier|thank|salamat|official|discount|items?\s*sold|card|gcash|maya|tendered|payment|tel|telephone|contact|mobile|address|permit|accreditation|serial|min\b|ptu|customer|sold\s*to|terms|page)\b/i;

const REFERENCE =
  /\b(?:invoice|receipt|delivery\s*receipt|sales\s*invoice|s\.?i\.?|d\.?r\.?|o\.?r\.?|ref(?:erence)?)\s*(?:no\.?|number|#)?\s*[:#.]?\s*([A-Z0-9][A-Z0-9-]{2,})/i;

// "1,250.00" / "P9.50" / "₱10" / "9,50" → number, or null.
const to_number = (token) => {
  let t = token.replace(/^[P₱]/i, "").replace(/[O]/g, "0");
  if (/^\d{1,3}(,\d{3})+(\.\d{1,2})?$/.test(t)) t = t.replace(/,/g, "");
  else if (/^\d+,\d{2}$/.test(t)) t = t.replace(",", ".");
  if (!/^\d+(\.\d{1,2})?$/.test(t)) return null;
  return Number(t);
};

// Words between the numbers we can ignore: "2 x 9.50", "24 pcs @ 9.50".
const FILLER = /^(x|@|pcs?|pks?|packs?|ea|each|units?|=)$/i;

const is_int = (n) => Number.isInteger(n);
const close = (a, b) => Math.abs(a - b) <= Math.max(0.05, b * 0.01);
const money = (n) => cents(n) / 100;
const exact_cents = (n) => Math.abs(n * 100 - Math.round(n * 100)) < 1e-6;

// Works out quantity and unit cost from the numbers on one line.
const read_numbers = (nums, lead_qty) => {
  const valid = (qty, price, confidence) =>
    is_int(qty) && qty >= 1 && qty <= 9999 && price > 0 && price < 100000
      ? { quantity: qty, unit_cost: money(price), confidence }
      : null;

  if (nums.length >= 3) {
    const [a, b, c] = nums.slice(-3);
    if (close(a * b, c)) {
      if (is_int(a)) return valid(a, b, "high");
      if (is_int(b)) return valid(b, a, "high");
    }
  }
  if (nums.length >= 2) {
    const [a, b] = nums.slice(-2);
    if (lead_qty) {
      if (close(lead_qty * a, b)) return valid(lead_qty, a, "high");
      return valid(lead_qty, exact_cents(b / lead_qty) && b > a ? b / lead_qty : a, "medium");
    }
    if (is_int(a) && a <= 999) {
      // "24 228.00" (qty + amount) or "24 9.50" (qty + unit cost)
      const per = b / a;
      return valid(a, exact_cents(per) && b >= a ? per : b, "medium");
    }
    // "9.50 228.00" (unit cost + amount)
    const qty = b / a;
    if (close(qty, Math.round(qty))) return valid(Math.round(qty), a, "medium");
  }
  if (nums.length >= 1) {
    const n = nums.at(-1);
    if (lead_qty) return valid(lead_qty, exact_cents(n / lead_qty) ? n / lead_qty : n, "low");
    return valid(1, n, "low");
  }
  return null;
};

// Splits a line into its name and the numbers at the end.
const split_line = (line) => {
  const tokens = line.trim().split(/\s+/).filter(Boolean);
  const nums = [];
  let i = tokens.length - 1;
  for (; i >= 0; i--) {
    const t = tokens[i].replace(/^[x@]/i, "").replace(/[x@]$/i, "");
    if (FILLER.test(tokens[i])) continue;
    const n = to_number(t);
    if (n === null) break;
    nums.unshift(n);
  }
  let name_tokens = tokens.slice(0, i + 1);
  // Leading quantity: "24 LUCKY ME CANTON 9.50 228.00" or "24x LUCKY ME…"
  let lead_qty = null;
  const first = name_tokens[0]?.replace(/x$/i, "");
  if (name_tokens.length > 1 && /^\d{1,4}$/.test(first ?? "")) {
    lead_qty = Number(first);
    name_tokens = name_tokens.slice(1);
    if (FILLER.test(name_tokens[0] ?? "")) name_tokens = name_tokens.slice(1);
  }
  const name = name_tokens
    .join(" ")
    .replace(/[|_*~^"]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return { name, nums, lead_qty };
};

/**
 * OCR text → { supplier, reference, lines: [{ receipt_name, quantity,
 * unit_cost, confidence, raw }] }. Anything unsure is marked "low" so the
 * manager checks it.
 */
export const parse_receipt = (text) => {
  const rows = String(text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let reference = "";
  let supplier = "";
  const lines = [];
  let pending = null; // item name whose numbers are on the next line

  rows.forEach((raw, index) => {
    const ref = raw.match(REFERENCE);
    if (ref && !reference && /\d/.test(ref[1])) reference = ref[1].toUpperCase();
    if (SKIP.test(raw) || ref) {
      pending = null;
      return;
    }
    const { name, nums, lead_qty } = split_line(raw);
    const letters = (name.match(/[a-z]/gi) ?? []).length;

    // Store name: first wordy line near the top with no prices.
    if (!supplier && index < 4 && letters >= 3 && nums.length === 0) {
      supplier = name.slice(0, 80);
      return;
    }
    if (letters < 3 && nums.length > 0 && pending) {
      const read = read_numbers(nums, lead_qty);
      if (read) lines.push({ receipt_name: pending.slice(0, 80), ...read, raw: `${pending} ${raw}` });
      pending = null;
      return;
    }
    if (letters >= 3 && nums.length === 0) {
      pending = name;
      return;
    }
    if (letters >= 3) {
      const read = read_numbers(nums, lead_qty);
      if (read) lines.push({ receipt_name: name.slice(0, 80), ...read, raw });
    }
    pending = null;
  });

  return { supplier, reference, lines };
};

// ─── Matching lines to products ──────────────────────────────
export const normalize = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, " ")
    .replace(/(\d)\s+(g|ml|l|kg|pcs?|s)\b/g, "$1$2") // "155 g" → "155g"
    .replace(/\s+/g, " ")
    .trim();

const tokens = (s) => normalize(s).split(" ").filter((t) => t.length > 0);
const is_size = (t) => /^\d+(\.\d+)?(g|ml|l|kg|pcs?|s)$/.test(t);

const edit_distance = (a, b) => {
  const dp = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= b.length; j++) {
      const tmp = dp[j];
      dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[b.length];
};

// How alike two words are, 0..1 (handles "CNTN" vs "canton", OCR typos).
const word_score = (a, b) => {
  if (a === b) return 1;
  if (is_size(a) || is_size(b)) return 0; // sizes must match exactly
  if (a.length >= 2 && b.length >= 2 && (b.startsWith(a) || a.startsWith(b))) return 0.8;
  const skeleton = (w) => w[0] + w.slice(1).replace(/[aeiou]/g, "");
  if (a.length >= 3 && b.length >= 3 && skeleton(a) === skeleton(b)) return 0.75;
  if (Math.min(a.length, b.length) >= 4) {
    const ratio = 1 - edit_distance(a, b) / Math.max(a.length, b.length);
    if (ratio >= 0.75) return ratio * 0.9;
  }
  return 0;
};

export const match_score = (receipt_name, product) => {
  const key = normalize(receipt_name);
  if ((product.receipt_names ?? []).includes(key)) return 1; // learned before
  const r = tokens(receipt_name);
  const p = tokens(`${product.brand ?? ""} ${product.name ?? ""}`);
  if (!r.length || !p.length) return 0;
  let total = 0;
  for (const w of r) total += Math.max(0, ...p.map((q) => word_score(w, q)));
  // A size on both sides that differs (60g vs 80g) is a different product.
  const r_sizes = r.filter(is_size);
  const p_sizes = p.filter(is_size);
  const size_clash = r_sizes.length && p_sizes.length && !r_sizes.some((s) => p_sizes.includes(s));
  const score = (2 * total) / (r.length + Math.min(p.length, r.length + 2));
  return Math.min(0.99, size_clash ? score * 0.4 : score);
};

// Best product guesses for a receipt line, most likely first.
export const match_products = (receipt_name, products, limit = 3) =>
  products
    .map((product) => ({ product, score: match_score(receipt_name, product) }))
    .filter((m) => m.score >= 0.3)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

export const AUTO_MATCH = 0.55;

// ─── Pricing / discount math ─────────────────────────────────
// Mirror of backend/utils/pricing.js — keep the two in sync. Used only to
// show totals in the POS; the server recomputes and its numbers are what
// get saved and printed on the receipt.
//
// All math is done in integer centavos to avoid floating-point drift.
// Prices are VAT-inclusive (PH 12% VAT).

export const VAT_RATE = 0.12;

// Discounts above this need a manager's approval (PIN) when a cashier
// applies them. Senior/PWD discounts always do.
export const LARGE_DISCOUNT_PERCENT = 20;

export const DISCOUNT_TYPES = ["none", "senior", "pwd", "percent", "amount"];

const to_cents = (n) => Math.round(Number(n) * 100);
const to_pesos = (c) => c / 100;

// VAT portion contained in a VAT-inclusive amount (in centavos).
const vat_in = (cents) => Math.round((cents * VAT_RATE) / (1 + VAT_RATE));

// Line total in pesos, rounded to the centavo (kilos can have decimals).
export const line_subtotal = (unit_price, quantity) =>
  to_pesos(Math.round(to_cents(unit_price) * Number(quantity)));

/**
 * Compute order totals.
 *
 * Senior citizen / PWD (RA 9994 / RA 10754): the sale is VAT-exempt and
 * the 20% discount applies to the VAT-exclusive price:
 *     total = subtotal / 1.12 × 0.80
 * discount_amount is reported as everything taken off the VAT-inclusive
 * subtotal (VAT removed + 20%), so subtotal − discount_amount = total.
 *
 * @param {number} subtotal VAT-inclusive subtotal in pesos
 * @param {{type?: string, value?: number|string}|null} discount
 */
export const compute_totals = (subtotal, discount) => {
  const sub_c = to_cents(subtotal);
  const type = discount?.type ?? "none";

  let total_c = sub_c;
  let vat_exempt = false;

  if (type === "senior" || type === "pwd") {
    const vat_excl_c = Math.round(sub_c / (1 + VAT_RATE));
    total_c = Math.round(vat_excl_c * 0.8);
    vat_exempt = true;
  } else if (type === "percent") {
    const pct = Math.min(Math.max(Number(discount.value) || 0, 0), 100);
    total_c = sub_c - Math.round((sub_c * pct) / 100);
  } else if (type === "amount") {
    const amt_c = Math.min(Math.max(to_cents(discount.value) || 0, 0), sub_c);
    total_c = sub_c - amt_c;
  }

  return {
    subtotal: to_pesos(sub_c),
    discount_amount: to_pesos(sub_c - total_c),
    total: to_pesos(total_c),
    vat_amount: vat_exempt ? 0 : to_pesos(vat_in(total_c)),
    vat_exempt,
  };
};

/**
 * Validate the shape of a discount request (not who may give it).
 * Returns { ok: true } or { ok: false, status, message }.
 *
 * @param {object|null|undefined} discount
 */
export const validate_discount = (discount) => {
  if (!discount || discount.type === "none" || discount.type === undefined) {
    return { ok: true };
  }
  if (typeof discount !== "object" || !DISCOUNT_TYPES.includes(discount.type)) {
    return { ok: false, status: 400, message: "Invalid discount type." };
  }

  if (discount.type === "senior" || discount.type === "pwd") {
    if (typeof discount.id_number !== "string" || !discount.id_number.trim()) {
      return {
        ok: false,
        status: 400,
        message: "Senior/PWD discount requires an ID number.",
      };
    }
    return { ok: true };
  }

  const value = Number(discount.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { ok: false, status: 400, message: "Discount value must be positive." };
  }
  if (discount.type === "percent" && value > 100) {
    return { ok: false, status: 400, message: "Discount cannot exceed 100%." };
  }
  return { ok: true };
};

/**
 * Why a discount needs a manager's approval, or null if it doesn't.
 *   "senior_pwd" → any senior citizen / PWD discount
 *   "large"      → a manual discount above LARGE_DISCOUNT_PERCENT
 *
 * @param {object|null|undefined} discount
 * @param {number} subtotal VAT-inclusive subtotal in pesos
 */
export const discount_approval = (discount, subtotal) => {
  if (!discount || !discount.type || discount.type === "none") return null;
  if (discount.type === "senior" || discount.type === "pwd") return "senior_pwd";
  const value = Number(discount.value) || 0;
  const percent =
    discount.type === "percent" ? value : subtotal > 0 ? (value / subtotal) * 100 : 100;
  return percent > LARGE_DISCOUNT_PERCENT ? "large" : null;
};

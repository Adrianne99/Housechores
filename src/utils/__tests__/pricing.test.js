import { describe, expect, test } from "vitest";
import { compute_totals, line_subtotal } from "../pricing";

// These must match backend/tests/pricing.test.js — the POS shows these
// numbers and the server charges them.
describe("compute_totals", () => {
  test("senior/PWD = subtotal / 1.12 × 0.8, VAT-exempt", () => {
    expect(compute_totals(112, { type: "senior" })).toMatchObject({
      total: 80,
      discount_amount: 32,
      vat_amount: 0,
      vat_exempt: true,
    });
    // The old formula showed 82.14 here and overcharged the customer.
    expect(compute_totals(100, { type: "pwd" }).total).toBe(71.43);
  });

  test("percent / amount / none", () => {
    expect(compute_totals(250, { type: "percent", value: 10 }).total).toBe(225);
    expect(compute_totals(250, { type: "amount", value: 30 }).total).toBe(220);
    expect(compute_totals(50, { type: "amount", value: 80 }).total).toBe(0);
    expect(compute_totals(112, null)).toMatchObject({ total: 112, vat_amount: 12 });
  });

  test("line totals avoid floating point drift", () => {
    expect(line_subtotal(19.99, 3)).toBe(59.97);
    expect(line_subtotal(0.1, 3)).toBe(0.3);
  });
});

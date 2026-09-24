// Cash drawer helpers.

// Philippine bills and coins (must match backend DENOMINATIONS).
export const DENOMINATIONS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.25];

export const count_total = (count) =>
  Object.entries(count).reduce(
    (t, [d, q]) => t + Math.round(Number(d) * 100) * (Number(q) || 0),
    0,
  ) / 100;

// Only non-zero whole counts are sent to the server.
export const clean_count = (count) =>
  Object.fromEntries(
    Object.entries(count)
      .map(([d, q]) => [d, Math.floor(Number(q) || 0)])
      .filter(([, q]) => q > 0),
  );

export const z_label = (n) => (n ? `Z-${String(n).padStart(4, "0")}` : "Open");

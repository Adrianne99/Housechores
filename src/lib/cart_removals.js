// Items taken out of the POS cart before payment are reported to the
// server (they show on the drawer reading and in the Activity Log).
// Kept on this device until sent, so a dropped connection loses nothing;
// each report has a client_ref so a resend is recorded once.
import axios from "axios";
import { is_network_error, new_client_ref } from "./offline_sales";

const KEY = "pos_cart_removals_v1";

const load = () => {
  try {
    const list = JSON.parse(localStorage.getItem(KEY) ?? "[]");
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
};
const save = (list) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    /* storage blocked: the report stays in memory until sent */
  }
};

let queue = load();
let sending = false;

const flush = async () => {
  if (sending || !queue.length || (typeof navigator !== "undefined" && !navigator.onLine)) return;
  sending = true;
  try {
    while (queue.length) {
      const next = queue[0];
      try {
        await axios.post("/api/orders/cart-removals", next);
      } catch (err) {
        if (is_network_error(err)) break; // offline: try again later
        // Refused (e.g. signed out): nothing a retry would fix.
      }
      queue = queue.filter((r) => r.client_ref !== next.client_ref);
      save(queue);
    }
  } finally {
    sending = false;
  }
};

// { kind, items: [{ inventory_id?, name, unit_price, quantity }], cart_total,
//   after_total_shown, branch? }
export const report_removal = (removal) => {
  if (!removal.items?.length) return;
  queue = [...queue, { ...removal, client_ref: new_client_ref(), at: new Date().toISOString() }];
  save(queue);
  flush();
};

if (typeof window !== "undefined") {
  window.addEventListener("online", flush);
  setInterval(flush, 30_000);
  flush();
}

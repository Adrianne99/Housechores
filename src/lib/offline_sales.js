// Sales rung up while the internet is down. They're kept on this device
// (localStorage) and sent to the server when the connection comes back.
// Each sale has a client_ref so a retried send is never recorded twice.
import axios from "axios";
import { queryClient } from "./query";

const KEY = "pos_offline_sales_v1";
const listeners = new Set();

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
    /* storage full or blocked: the sale stays in memory until synced */
  }
};

let state = {
  online: typeof navigator === "undefined" ? true : navigator.onLine,
  syncing: false,
  pending: load(), // [{ client_ref, owner, payload, total, created_at, error? }]
  last_synced: 0,
};
const set = (patch) => {
  state = { ...state, ...patch };
  if ("pending" in patch) save(state.pending);
  listeners.forEach((l) => l());
};

export const subscribe = (l) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
export const get_snapshot = () => state;

// Only the signed-in cashier's own offline sales are sent (their drawer).
let current_user = null;
export const set_offline_user = (id) => {
  current_user = id ? String(id) : null;
};

export const new_client_ref = () =>
  globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

// No response at all = we couldn't reach the server (not a rejected sale).
export const is_network_error = (err) => !!err && !err.response && (err.code === "ERR_NETWORK" || !!err.request || !navigator.onLine);

export const enqueue = (payload, total) => {
  set({
    pending: [
      ...state.pending,
      { client_ref: payload.client_ref, owner: current_user, payload, total, created_at: new Date().toISOString() },
    ],
  });
};

export const discard = (client_ref) => set({ pending: state.pending.filter((p) => p.client_ref !== client_ref) });

export const sync = async () => {
  if (state.syncing || !navigator.onLine) return;
  const mine = state.pending.filter((p) => !p.error && (!p.owner || p.owner === current_user));
  if (!mine.length) return;
  set({ syncing: true });
  let sent = 0;
  for (const p of mine) {
    try {
      await axios.post("/api/orders", p.payload);
      sent += 1;
      set({ pending: state.pending.filter((x) => x.client_ref !== p.client_ref) });
    } catch (err) {
      if (is_network_error(err)) break; // still offline — try again later
      // The server refused it (e.g. stock ran out): keep it for a manager.
      const message = err.response?.data?.message ?? err.message;
      set({ pending: state.pending.map((x) => (x.client_ref === p.client_ref ? { ...x, error: message } : x)) });
    }
  }
  set({ syncing: false, last_synced: sent ? Date.now() : state.last_synced });
  if (sent) {
    for (const key of ["orders", "dashboard", "drawer", "products"]) {
      queryClient.invalidateQueries({ queryKey: [key] });
    }
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("online", () => {
    set({ online: true });
    sync();
  });
  window.addEventListener("offline", () => set({ online: false }));
  // Retry every 30s in case the "online" event was missed.
  setInterval(() => {
    if (state.pending.some((p) => !p.error)) sync();
  }, 30_000);
}

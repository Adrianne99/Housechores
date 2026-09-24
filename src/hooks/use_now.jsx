import { useSyncExternalStore } from "react";

// A shared ticking clock (no useEffect): components subscribe to one
// interval per tick rate, and it stops when nobody is listening.
const clocks = new Map(); // ms → { now, listeners, id }

const clock_for = (ms) => {
  let c = clocks.get(ms);
  if (!c) {
    c = { now: Date.now(), listeners: new Set(), id: null };
    clocks.set(ms, c);
  }
  return c;
};

const subscribe_to = (ms) => (listener) => {
  const c = clock_for(ms);
  c.listeners.add(listener);
  if (!c.id) {
    c.now = Date.now();
    c.id = setInterval(() => {
      c.now = Date.now();
      c.listeners.forEach((l) => l());
    }, ms);
  }
  return () => {
    c.listeners.delete(listener);
    if (c.listeners.size === 0) {
      clearInterval(c.id);
      c.id = null;
    }
  };
};

const subscribers = new Map();

// Current time as a Date, updated every `ms` milliseconds.
export const useNow = (ms = 1000) => {
  if (!subscribers.has(ms)) subscribers.set(ms, subscribe_to(ms));
  const t = useSyncExternalStore(subscribers.get(ms), () => clock_for(ms).now);
  return new Date(t);
};

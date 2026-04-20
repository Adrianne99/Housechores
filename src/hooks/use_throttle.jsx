// hooks/use_throttle.js
import { useRef, useCallback } from "react";

export const useThrottle = (fn, delay = 2000) => {
  const lastCall = useRef(0);

  return useCallback(
    (...args) => {
      const now = Date.now();
      if (now - lastCall.current < delay) return;
      lastCall.current = now;
      fn(...args);
    },
    [fn, delay],
  );
};

import { useRef, useCallback } from "react";

export const useDebounce = (fn, delay = 600) => {
  const timerRef = useRef(null);

  const debounced = useCallback(
    (...args) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay],
  );

  return debounced;
};

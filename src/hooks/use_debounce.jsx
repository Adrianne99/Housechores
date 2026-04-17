import { useRef } from "react";

export const useDebounce = (fn, delay = 600) => {
  const timerRef = useRef(null);
  const fnRef = useRef(fn);

  // Keep fnRef current without causing re-renders
  fnRef.current = fn;

  const debounced = useRef((...args) => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      fnRef.current(...args);
    }, delay);
  });

  return debounced.current;
};

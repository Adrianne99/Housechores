import { useState, useEffect } from "react";

export const Countdown = ({ onComplete }) => {
  const [seconds, setSeconds] = useState(300);

  useEffect(() => {
    if (seconds <= 0) {
      onComplete(); // This triggers setIsTimerActive(false) in the parent
      return;
    }

    const timer = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [seconds, onComplete]);

  // Don't show "0s" - once it's 0, the parent text changes to "Resend code"
  return seconds > 0 ? <span>&nbsp;{seconds}s</span> : null;
};

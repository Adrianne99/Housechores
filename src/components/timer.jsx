import { useNow } from "../hooks/use_now";

// Seconds left until `until` (a timestamp). Derived from a shared clock,
// so there's no interval or completion callback to manage.
export const Countdown = ({ until }) => {
  const now = useNow(1000).getTime();
  const seconds = Math.ceil((until - now) / 1000);
  // Don't show "0s" - once it's 0, the parent text changes to "Resend code"
  return seconds > 0 ? <span>&nbsp;{seconds}s</span> : null;
};

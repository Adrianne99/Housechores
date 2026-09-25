import { useState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { useNow } from "../hooks/use_now";
import { hours_label, time_of } from "../utils/format";
import { cn } from "../utils/utils";

// Clock in / out button that asks for confirmation before saving.
// `clock` is the object returned by useTimeClock().
export const ClockButton = ({ clock, className, iconSize = 16 }) => {
  const [asking, setAsking] = useState(false);
  const on_shift = !!clock.status?.clocked_in;

  return (
    <>
      <button
        type="button"
        onClick={() => setAsking(true)}
        disabled={clock.busy || !clock.status}
        className={cn(
          "flex items-center justify-center gap-2 text-white font-semibold transition-colors disabled:opacity-50",
          on_shift ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700",
          className,
        )}
      >
        {on_shift ? <LogOut size={iconSize} /> : <LogIn size={iconSize} />}
        {clock.busy ? "Saving..." : on_shift ? "Clock out" : "Clock in"}
      </button>

      {asking && (
        <ClockConfirmDialog
          on_shift={on_shift}
          since={clock.status?.clock_in}
          busy={clock.busy}
          onCancel={() => setAsking(false)}
          onConfirm={async () => {
            await clock.toggleAsync();
            setAsking(false);
          }}
        />
      )}
    </>
  );
};

const ClockConfirmDialog = ({ on_shift, since, busy, onCancel, onConfirm }) => {
  const now = useNow(1000);
  const worked = since ? (now - new Date(since)) / 3600000 : 0;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={busy ? undefined : onCancel} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={on_shift ? "Confirm clock out" : "Confirm clock in"}
        onKeyDown={(e) => e.key === "Escape" && !busy && onCancel()}
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 text-center"
      >
        <span
          className={cn(
            "mx-auto mb-3 flex size-12 items-center justify-center rounded-full",
            on_shift ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600",
          )}
        >
          <Clock size={24} />
        </span>
        <p className="text-lg font-bold text-gray-900">{on_shift ? "Clock out now?" : "Clock in now?"}</p>
        <p className="text-3xl font-bold text-gray-900 tabular-nums mt-2">{time_of(now)}</p>
        <p className="text-sm text-gray-500 mt-1">
          {on_shift
            ? `On shift since ${time_of(since)} · ${hours_label(worked)} worked`
            : "Your shift starts when you confirm."}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600"
          >
            Cancel
          </button>
          <button
            type="button"
            autoFocus
            disabled={busy}
            onClick={onConfirm}
            className={cn(
              "flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold disabled:opacity-50",
              on_shift ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700",
            )}
          >
            {on_shift ? <LogOut size={16} /> : <LogIn size={16} />}
            {busy ? "Saving..." : on_shift ? "Yes, clock out" : "Yes, clock in"}
          </button>
        </div>
      </div>
    </div>
  );
};

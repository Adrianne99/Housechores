import { useState } from "react";
import { today_local } from "../utils/format";
import { cn } from "../utils/utils";

export const add_days = (date, n) => {
  const d = new Date(`${date}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};

export const PRESETS = [
  { key: "today", label: "Today", range: (t) => [t, t] },
  { key: "7", label: "Last 7 days", range: (t) => [add_days(t, -6), t] },
  { key: "30", label: "Last 30 days", range: (t) => [add_days(t, -29), t] },
  { key: "month", label: "This month", range: (t) => [`${t.slice(0, 8)}01`, t] },
];

// Preset buttons + from/to pickers. Returns [[from, to], controls].
export const useDateRange = (initial = "7") => {
  const today = today_local();
  const [preset, setPreset] = useState(initial);
  const [range, setRange] = useState(() => PRESETS.find((p) => p.key === initial).range(today));
  const controls = (
    <>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => {
            setPreset(p.key);
            setRange(p.range(today));
          }}
          className={cn("px-3 py-1.5 text-xs font-semibold rounded-full border", preset === p.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50")}
        >
          {p.label}
        </button>
      ))}
      <input type="date" aria-label="From" value={range[0]} max={range[1]} onChange={(e) => e.target.value && (setPreset(null), setRange([e.target.value, range[1]]))} className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white" />
      <span className="text-gray-400">to</span>
      <input type="date" aria-label="To" value={range[1]} min={range[0]} max={today} onChange={(e) => e.target.value && (setPreset(null), setRange([range[0], e.target.value]))} className="px-2 py-1.5 text-sm border border-gray-200 rounded-lg bg-white" />
    </>
  );
  return [range, controls];
};

import { peso } from "../utils/format";
import { DENOMINATIONS, count_total } from "../utils/cash";

const label = (d) => (d < 1 ? `${d * 100}¢` : `₱${d.toLocaleString("en-PH")}`);

// Bill/coin counter: quantity per denomination → running total.
export const CashCounter = ({ count, onChange }) => (
  <div>
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
      {DENOMINATIONS.map((d) => (
        <label
          key={d}
          className="flex flex-col gap-1 text-xs text-gray-500 bg-gray-50 rounded-lg p-2"
        >
          <span className="font-semibold text-gray-700">{label(d)}</span>
          <input
            type="number"
            min={0}
            step={1}
            inputMode="numeric"
            aria-label={`Number of ${label(d)}`}
            value={count[d] ?? ""}
            onChange={(e) => onChange({ ...count, [d]: e.target.value })}
            placeholder="0"
            className="w-full px-2 py-1.5 text-sm border border-gray-200 rounded-md bg-white tabular-nums"
          />
          <span className="text-[11px] text-gray-400 tabular-nums">
            {peso(d * (Number(count[d]) || 0))}
          </span>
        </label>
      ))}
    </div>
    <p className="mt-3 text-right text-sm text-gray-600">
      Total counted:{" "}
      <span className="text-lg font-bold text-gray-900 tabular-nums">{peso(count_total(count))}</span>
    </p>
  </div>
);

import { useState } from "react";
import { Tag, X, ChevronDown, ChevronUp } from "lucide-react";

const DISCOUNT_TYPES = [
  { value: "senior", label: "Senior Citizen (20%)", needsId: true },
  { value: "pwd", label: "PWD (20%)", needsId: true },
  { value: "percent", label: "% off", needsValue: true },
  { value: "amount", label: "₱ off", needsValue: true },
];

export const DiscountSection = ({ discount, totals, onApply, onClear }) => {
  const [expanded, setExpanded] = useState(false);
  const [draftType, setDraftType] = useState("senior");
  const [draftValue, setDraftValue] = useState("");
  const [draftIdNumber, setDraftIdNumber] = useState("");
  const [draftReason, setDraftReason] = useState("");
  const [error, setError] = useState(null);

  const selectedTypeConfig = DISCOUNT_TYPES.find((t) => t.value === draftType);

  const handleApply = () => {
    setError(null);

    if (selectedTypeConfig.needsId && !draftIdNumber.trim()) {
      setError("ID number is required.");
      return;
    }

    if (selectedTypeConfig.needsValue) {
      const num = Number(draftValue);
      if (!Number.isFinite(num) || num <= 0) {
        setError("Enter a valid amount.");
        return;
      }
      if (draftType === "percent" && num > 100) {
        setError("Percent cannot exceed 100.");
        return;
      }
    }

    onApply({
      type: draftType,
      value:
        draftType === "senior" || draftType === "pwd" ? 20 : Number(draftValue),
      id_number: draftIdNumber.trim() || undefined,
      reason: draftReason.trim() || undefined,
    });
    setExpanded(false);
    setDraftValue("");
    setDraftIdNumber("");
    setDraftReason("");
  };

  const handleRemove = () => {
    onClear();
    setExpanded(false);
  };

  // ─── Applied state ──────────────────────────────────────
  if (discount && discount.type !== "none" && !expanded) {
    const label =
      discount.type === "senior"
        ? `Senior · ${discount.id_number ?? ""}`
        : discount.type === "pwd"
          ? `PWD · ${discount.id_number ?? ""}`
          : discount.type === "percent"
            ? `${discount.value}% off`
            : `₱${discount.value} off`;

    return (
      <div className="bg-green-50 border border-green-100 rounded-xl px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <Tag size={14} className="text-green-600 shrink-0" />
          <div className="min-w-0">
            <p className="text-xs font-medium text-green-700 truncate">
              {label}
            </p>
            <p className="text-xs text-green-600">
              -₱{totals.discount_amount.toFixed(2)}
            </p>
          </div>
        </div>
        <button
          onClick={handleRemove}
          className="p-1 rounded-lg hover:bg-green-100 text-green-600 shrink-0"
          title="Remove discount"
        >
          <X size={14} />
        </button>
      </div>
    );
  }

  // ─── Collapsed state ────────────────────────────────────
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="w-full flex items-center justify-between px-3 py-2 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
      >
        <div className="flex items-center gap-2">
          <Tag size={14} />
          <span>Apply discount</span>
        </div>
        <ChevronDown size={14} />
      </button>
    );
  }

  // ─── Expanded form ──────────────────────────────────────
  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-600">Apply discount</p>
        <button
          onClick={() => setExpanded(false)}
          className="p-1 rounded-lg hover:bg-gray-200 text-gray-400"
        >
          <ChevronUp size={14} />
        </button>
      </div>

      <select
        value={draftType}
        onChange={(e) => {
          setDraftType(e.target.value);
          setError(null);
        }}
        className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 bg-white"
      >
        {DISCOUNT_TYPES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>

      {selectedTypeConfig.needsId && (
        <input
          type="text"
          value={draftIdNumber}
          onChange={(e) => {
            setDraftIdNumber(e.target.value);
            setError(null);
          }}
          placeholder="ID number (required)"
          className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
        />
      )}

      {selectedTypeConfig.needsValue && (
        <div className="flex gap-2">
          <input
            type="number"
            value={draftValue}
            onChange={(e) => {
              setDraftValue(e.target.value);
              setError(null);
            }}
            placeholder={draftType === "percent" ? "%" : "₱"}
            className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
          />
          <input
            type="text"
            value={draftReason}
            onChange={(e) => setDraftReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-[2] px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400"
          />
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 bg-red-50 px-2 py-1 rounded-lg">
          ⚠ {error}
        </p>
      )}

      <button
        onClick={handleApply}
        className="w-full py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
      >
        Apply
      </button>
    </div>
  );
};

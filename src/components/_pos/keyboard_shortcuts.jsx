import { Keyboard } from "lucide-react";

const SHORTCUTS = [
  { keys: ["Enter"], label: "Add scanned / first match" },
  { keys: ["Esc"], label: "Clear search" },
  { keys: ["F1"], label: "Custom item" },
  { keys: ["F2"], label: "Focus search" },
  { keys: ["F3"], label: "Held orders" },
  { keys: ["F4"], label: "Hold cart" },
  { keys: ["F9"], label: "Charge" },
];

const Key = ({ children }) => (
  <kbd className="px-1.5 py-0.5 text-[11px] font-semibold text-gray-600 bg-gray-100 border border-gray-200 border-b-2 rounded">
    {children}
  </kbd>
);

export const KeyboardShortcuts = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 px-5 py-3">
    <div className="flex items-center gap-2 mb-2">
      <Keyboard size={15} className="text-indigo-500" />
      <span className="text-xs font-semibold text-gray-700">
        Keyboard shortcuts
      </span>
    </div>
    <div className="flex flex-wrap gap-x-5 gap-y-2">
      {SHORTCUTS.map((s) => (
        <div key={s.label} className="flex items-center gap-1.5">
          {s.keys.map((k) => (
            <Key key={k}>{k}</Key>
          ))}
          <span className="text-[11px] text-gray-500">{s.label}</span>
        </div>
      ))}
    </div>
  </div>
);

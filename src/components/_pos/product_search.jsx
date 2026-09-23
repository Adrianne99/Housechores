import { useState, useEffect, useRef, useCallback } from "react";
import { Search, ScanLine } from "lucide-react";

export const ProductSearch = ({
  findByBarcode,
  search,
  onProductPicked,
  inputRef: externalInputRef,
}) => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  // Merge our internal ref with an optional parent ref so the parent can
  // focus the field (e.g. via the F2 shortcut) without us losing the
  // stable internal ref used for focus-after-pick.
  const setInputRef = useCallback(
    (node) => {
      inputRef.current = node;
      if (externalInputRef) externalInputRef.current = node;
    },
    [externalInputRef],
  );

  // Auto-focus on mount and after a sale
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle search results when query changes
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    setSuggestions(search(query));
  }, [query, search]);

  const handlePick = useCallback(
    (product) => {
      onProductPicked(product);
      setQuery("");
      setSuggestions([]);
      setShowSuggestions(false);
      inputRef.current?.focus();
    },
    [onProductPicked],
  );

  // Enter key: try barcode first, then top suggestion
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        const exact = findByBarcode(query);
        if (exact) {
          handlePick(exact);
          return;
        }
        if (suggestions[0]) {
          handlePick(suggestions[0]);
        }
      }
      if (e.key === "Escape") {
        setQuery("");
        setSuggestions([]);
        setShowSuggestions(false);
      }
    },
    [query, suggestions, findByBarcode, handlePick],
  );

  return (
    <div className="relative">
      <div className="relative">
        <ScanLine
          size={20}
          className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-400"
        />
        <input
          ref={setInputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          onKeyDown={handleKeyDown}
          placeholder="Scan barcode or search product name..."
          className="w-full pl-12 pr-4 py-4 text-base border-2 border-indigo-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-100 focus:border-indigo-400 bg-white"
          autoFocus
        />
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 overflow-hidden">
          {suggestions.map((p) => (
            <button
              key={p._id}
              onClick={() => handlePick(p)}
              className="w-full flex items-center justify-between px-4 py-3 hover:bg-indigo-50 transition-colors text-left border-b border-gray-50 last:border-b-0"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">
                  {p.name}
                </span>
                <span className="text-xs text-gray-400">
                  {p.brand} · {p.barcode}
                </span>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm font-bold text-indigo-600">
                  ₱{p.pricing.selling_price.toFixed(2)}
                </span>
                <span
                  className={`text-xs ${
                    p.stock_management.current_stock > 0
                      ? "text-gray-400"
                      : "text-red-500"
                  }`}
                >
                  {p.stock_management.current_stock > 0
                    ? `Stock: ${p.stock_management.current_stock}`
                    : "Out of stock"}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results */}
      {showSuggestions && query.trim() && suggestions.length === 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-20 p-6 text-center">
          <Search size={24} className="mx-auto text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">
            No products found for "{query}"
          </p>
          <p className="text-xs text-gray-400 mt-1">Press Esc to clear</p>
        </div>
      )}
    </div>
  );
};

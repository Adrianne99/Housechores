import { Trash2, Plus, Minus, Pause, PackagePlus, Inbox } from "lucide-react";
import { Button } from "../buttons";
import { DiscountSection } from "./discount_section";
import { line_total } from "../../hooks/use_cart";

export const CartPanel = ({
  items,
  discount,
  totals,
  isEmpty,
  updateQuantity,
  removeItem,
  clearCart,
  onCharge,
  onHold,
  onShowHeld,
  onAddCustom,
  applyDiscount,
  clearDiscount,
  heldCount = 0,
}) => {
  return (
    <div className="flex flex-col h-full min-h-0 overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100">
      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">
            Cart ({totals.item_count})
          </h2>
          <div className="flex items-center gap-1">
            <button
              onClick={onShowHeld}
              className="relative px-2 py-1 text-xs font-medium text-orange-600 hover:bg-orange-50 rounded-lg transition-colors flex items-center gap-1"
              title="View held orders"
            >
              <Inbox size={14} />
              Held
              {heldCount > 0 && (
                <span className="bg-orange-500 text-white text-[10px] px-1.5 rounded-full">
                  {heldCount}
                </span>
              )}
            </button>
            {!isEmpty && (
              <button
                onClick={clearCart}
                className="text-xs text-gray-400 hover:text-red-500 px-2 py-1"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 min-h-0 overflow-y-auto px-3 py-2">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <p className="text-sm text-gray-400">No items yet</p>
            <p className="text-xs text-gray-300 mt-1">
              Scan or search to add products
            </p>
            {onAddCustom && (
              <button
                onClick={onAddCustom}
                className="mt-4 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
              >
                <PackagePlus size={14} />
                Add custom item
              </button>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {items.map((item) => (
              <div
                key={item.key}
                className="bg-gray-50 rounded-xl p-3 hover:bg-gray-100 transition-colors"
              >
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1">
                      {item.name}
                      {item.is_custom && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-indigo-100 text-indigo-600 rounded-full font-normal">
                          custom
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-gray-400">
                      ₱{item.unit_price.toFixed(2)}{" "}
                      {item.unit ? `/ ${item.unit}` : ""}
                      {item.amount != null && (
                        <span className="ml-1 text-indigo-500 font-medium">· ₱{item.amount.toFixed(2)} worth</span>
                      )}
                    </p>
                  </div>
                  <button
                    onClick={() => removeItem(item.key)}
                    aria-label={`Remove ${item.name}`}
                    className="p-1 rounded-lg hover:bg-red-100 text-gray-300 hover:text-red-500 shrink-0"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() =>
                        updateQuantity(item.key, item.quantity - (item.by_weight ? 0.1 : 1))
                      }
                      aria-label={`Decrease ${item.name}`}
                      className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 flex items-center justify-center text-gray-600 hover:text-indigo-600"
                    >
                      <Minus size={12} />
                    </button>
                    <input
                      type="number"
                      min={item.by_weight ? 0.001 : 1}
                      step={item.by_weight ? 0.001 : 1}
                      inputMode={item.by_weight ? "decimal" : "numeric"}
                      aria-label={`Quantity of ${item.name}`}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.key, e.target.value)
                      }
                      className={`${item.by_weight ? "w-16" : "w-12"} text-center text-sm font-medium border border-gray-200 rounded-lg py-1 outline-none focus:border-indigo-400 bg-white`}
                    />
                    {item.by_weight && <span className="text-xs text-gray-400">{item.unit || "kg"}</span>}
                    <button
                      onClick={() =>
                        updateQuantity(item.key, item.quantity + (item.by_weight ? 0.1 : 1))
                      }
                      aria-label={`Increase ${item.name}`}
                      disabled={
                        Number.isFinite(item.available_stock) &&
                        item.quantity * (item.units_per ?? 1) >= item.available_stock
                      }
                      className="w-7 h-7 rounded-lg bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-300 flex items-center justify-center text-gray-600 hover:text-indigo-600 disabled:opacity-40"
                    >
                      <Plus size={12} />
                    </button>
                  </div>
                  <p className="text-sm font-bold text-gray-900 tabular-nums">
                    ₱{line_total(item).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}

            {onAddCustom && (
              <button
                onClick={onAddCustom}
                className="w-full text-xs font-medium text-indigo-600 hover:bg-indigo-50 rounded-xl py-2 flex items-center justify-center gap-1"
              >
                <PackagePlus size={14} />
                Add custom item
              </button>
            )}
          </div>
        )}
      </div>

      {/* Totals + actions */}
      <div className="shrink-0 px-6 py-4 border-t border-gray-100 space-y-3">
        {/* Discount inline */}
        {!isEmpty && (
          <DiscountSection
            discount={discount}
            totals={totals}
            onApply={applyDiscount}
            onClear={clearDiscount}
          />
        )}

        <div className="space-y-1">
          <div className="flex justify-between text-sm text-gray-500">
            <span>Subtotal</span>
            <span className="tabular-nums">₱{totals.subtotal.toFixed(2)}</span>
          </div>
          {totals.discount_amount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Discount</span>
              <span className="tabular-nums">
                -₱{totals.discount_amount.toFixed(2)}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xs text-gray-400">
            <span>
              VAT (12%
              {totals.vat_exempt ? ", exempt" : ", included"})
            </span>
            <span className="tabular-nums">
              ₱{totals.vat_amount.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-2 border-t border-gray-100">
            <span className="text-sm font-semibold text-gray-700">Total</span>
            <span className="text-2xl font-bold text-indigo-600 tabular-nums">
              ₱{totals.total.toFixed(2)}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <Button
            variant="secondary"
            size="md"
            className="col-span-1!"
            disabled={isEmpty}
            onClick={onHold}
          >
            <Pause size={14} />
            Hold
          </Button>
          <Button
            variant="primary"
            size="md"
            className="col-span-2!"
            disabled={isEmpty}
            onClick={onCharge}
          >
            Charge ₱{totals.total.toFixed(2)}
          </Button>
        </div>
      </div>
    </div>
  );
};

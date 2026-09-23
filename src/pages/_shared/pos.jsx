import { useState, useCallback, useEffect, useRef } from "react";
import { Camera } from "lucide-react";
import axios from "axios";
import Header from "../../components/header";
import { ProductSearch } from "../../components/_pos/product_search";
import { ProductGrid } from "../../components/_pos/product_grid";
import { KeyboardShortcuts } from "../../components/_pos/keyboard_shortcuts";
import { CartPanel } from "../../components/_pos/cart_panel";
import { ChargeModal } from "../../components/_modal/charge_modal";
import { ReceiptOverlay } from "../../components/_pos/receipt_overlay";
import { BarcodeScanner } from "../../components/_pos/barcode_scanner";
import { HoldModal } from "../../components/_modal/hold_modal";
import { HeldOrdersPanel } from "../../components/_pos/held_orders";
import { CustomItemModal } from "../../components/_modal/custom_item";
import { useCart } from "../../hooks/use_cart";
import { useProductLookup } from "../../hooks/use_product_lookup";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function POSPage() {
  const {
    items,
    discount,
    addItem,
    addCustomItem,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    clearDiscount,
    loadFromHeld,
    totals,
    isEmpty,
  } = useCart();

  const { allProducts, findByBarcode, search, loading, refresh } =
    useProductLookup();

  const searchInputRef = useRef(null);

  const [showCharge, setShowCharge] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showHoldModal, setShowHoldModal] = useState(false);
  const [showHeldPanel, setShowHeldPanel] = useState(false);
  const [showCustomItem, setShowCustomItem] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [scanError, setScanError] = useState(null);
  const [holdingLoading, setHoldingLoading] = useState(false);
  const [heldCount, setHeldCount] = useState(0);
  const [heldRefreshKey, setHeldRefreshKey] = useState(0);
  const [resumedFromId, setResumedFromId] = useState(null);

  // Fetch held count for badge
  useEffect(() => {
    axios
      .get(`${BACKEND_URL}/api/held-orders`)
      .then(({ data }) => {
        if (data.success) setHeldCount(data.held_orders.length);
      })
      .catch(() => {});
  }, [heldRefreshKey]);

  const refreshHeld = useCallback(() => setHeldRefreshKey((k) => k + 1), []);

  const handleSaleSuccess = useCallback(
    async (order) => {
      setCompletedOrder(order);
      setShowCharge(false);

      // If we resumed from a held order, delete it now that the sale completed
      if (resumedFromId) {
        try {
          await axios.delete(`${BACKEND_URL}/api/held-orders/${resumedFromId}`);
        } catch (err) {
          console.error("Could not delete resumed held order:", err);
        }
        setResumedFromId(null);
      }

      clearCart();
      refresh();
      refreshHeld();
    },
    [clearCart, refresh, refreshHeld, resumedFromId],
  );

  const handleNewSale = useCallback(() => {
    setCompletedOrder(null);
  }, []);

  const handleBarcodeDetected = useCallback(
    (barcode) => {
      const product = findByBarcode(barcode);
      if (product) {
        addItem(product);
        setShowScanner(false);
        setScanError(null);
      } else {
        setScanError(`No product found for barcode: ${barcode}`);
      }
    },
    [findByBarcode, addItem],
  );

  // ─── Hold cart ──────────────────────────────────────────
  const handleHoldConfirm = useCallback(
    async ({ customer_name, note }) => {
      setHoldingLoading(true);
      try {
        const { data } = await axios.post(`${BACKEND_URL}/api/held-orders`, {
          customer_name,
          note,
          items: items.map((i) => ({
            inventory_id: i.is_custom ? null : i.inventory_id,
            is_custom: i.is_custom,
            barcode: i.barcode,
            name: i.name,
            brand: i.brand,
            unit: i.unit,
            unit_price: i.unit_price,
            quantity: i.quantity,
          })),
        });
        if (!data.success) throw new Error(data.message);
        clearCart();
        setShowHoldModal(false);
        refreshHeld();
      } catch (err) {
        alert(err.response?.data?.message || err.message);
      } finally {
        setHoldingLoading(false);
      }
    },
    [items, clearCart, refreshHeld],
  );

  // ─── Resume held order ──────────────────────────────────
  const handleResumeHeld = useCallback(
    (held_order, id) => {
      loadFromHeld(held_order.items);
      setResumedFromId(id);
    },
    [loadFromHeld],
  );

  // ─── Global keyboard shortcuts ──────────────────────────
  useEffect(() => {
    const onKey = (e) => {
      switch (e.key) {
        case "F1": // add custom item
          e.preventDefault();
          setShowCustomItem(true);
          break;
        case "F2": // focus the search box
          e.preventDefault();
          searchInputRef.current?.focus();
          break;
        case "F3": // held orders
          e.preventDefault();
          setShowHeldPanel(true);
          break;
        case "F4": // hold current cart
          if (!isEmpty) {
            e.preventDefault();
            setShowHoldModal(true);
          }
          break;
        case "F9": // charge
          if (!isEmpty) {
            e.preventDefault();
            setShowCharge(true);
          }
          break;
        default:
          break;
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isEmpty]);

  if (loading) {
    return (
      <div className="relative w-full space-y-12 pt-3">
        <Header title="POS Terminal" />
        <div className="text-center text-gray-400 py-12">
          Loading products...
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full pt-3">
      <Header title="POS Terminal" />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-4 mt-6 h-[calc(100vh-200px)]">
        {/* Left */}
        <div className="flex flex-col gap-4 min-h-0">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex gap-2 items-center">
              <div className="flex-1">
                <ProductSearch
                  inputRef={searchInputRef}
                  findByBarcode={findByBarcode}
                  search={search}
                  onProductPicked={addItem}
                />
              </div>
              <button
                onClick={() => setShowScanner(true)}
                className="p-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl"
                title="Open camera scanner"
              >
                <Camera size={20} />
              </button>
            </div>
            {scanError && (
              <p className="mt-3 text-xs text-red-500 bg-red-50 px-3 py-2 rounded-lg">
                ⚠ {scanError}
              </p>
            )}
            <p className="mt-3 text-xs text-gray-400">
              Tip: Use a USB barcode scanner for fastest scanning.
            </p>
          </div>

          {/* Available products — click to add to cart */}
          <ProductGrid
            products={allProducts}
            cartItems={items}
            onPick={addItem}
          />

          {/* Keyboard shortcuts */}
          <KeyboardShortcuts />
        </div>

        {/* Right: Cart */}
        <div className="h-full">
          <CartPanel
            items={items}
            discount={discount}
            totals={totals}
            isEmpty={isEmpty}
            updateQuantity={updateQuantity}
            removeItem={removeItem}
            clearCart={clearCart}
            applyDiscount={applyDiscount}
            clearDiscount={clearDiscount}
            heldCount={heldCount}
            onCharge={() => setShowCharge(true)}
            onHold={() => setShowHoldModal(true)}
            onShowHeld={() => setShowHeldPanel(true)}
            onAddCustom={() => setShowCustomItem(true)}
          />
        </div>
      </div>

      {/* Modals & overlays */}
      <ChargeModal
        open={showCharge}
        onClose={() => setShowCharge(false)}
        total={totals.total}
        items={items}
        discount={discount}
        onSuccess={handleSaleSuccess}
      />

      <ReceiptOverlay
        open={!!completedOrder}
        order={completedOrder}
        onNewSale={handleNewSale}
      />

      <BarcodeScanner
        open={showScanner}
        onClose={() => {
          setShowScanner(false);
          setScanError(null);
        }}
        onDetected={handleBarcodeDetected}
      />

      <HoldModal
        open={showHoldModal}
        onClose={() => setShowHoldModal(false)}
        onConfirm={handleHoldConfirm}
        loading={holdingLoading}
      />

      <HeldOrdersPanel
        open={showHeldPanel}
        onClose={() => setShowHeldPanel(false)}
        onResume={handleResumeHeld}
        refreshKey={heldRefreshKey}
      />

      <CustomItemModal
        open={showCustomItem}
        onClose={() => setShowCustomItem(false)}
        onAdd={addCustomItem}
      />
    </div>
  );
}

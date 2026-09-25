import { useMemo, useState } from "react";
import { useProducts } from "../../hooks/use_product_lookup";
import { queryClient } from "../../lib/query";
import { Funnel, Plus, Download, X, Trash2 } from "lucide-react";
import axios from "axios";

import Header from "../../components/header";
import { DashboardCard, StocksCard } from "../../components/card";
import { Button } from "../../components/buttons";
import { BranchDropdown } from "../../components/dropdown";
import { BranchLabel } from "../../components/branch_label";
import { H4 } from "../../components/texts";
import { AddProductModal } from "../../components/modal";
import { FILTER_OPTIONS } from "../../constants/inventory";
import { useExportCSV } from "../../hooks/use_export";
import { useThrottle } from "../../hooks/use_throttle";

// ─── Defaults ────────────────────────────────────────────────
const DEFAULTS = {
  can_add_product: false,
  can_delete: false,
  can_switch_branch: false,
  show_export: false,
  show_checkbox: false,
  show_actions: false,
  can_delete_row: false,
  show_branch_breakdown: false,
  // ⬇️ NEW: which stat cards to show. Empty array = no cards.
  cards: [],
  show: { supplier: false, cost_price: false, selling_price: false },
  edit: {
    name: false,
    barcode: false,
    category: false,
    stock: false,
    supplier: false,
    cost_price: false,
  },
};

// ─── Card config registry ────────────────────────────────────
// Each card knows its title, sign, and how to compute its value
// from the products array. Add new cards here — never inline.
const CARD_BUILDERS = {
  inventory_value: (products) => {
    const total = products.reduce(
      (sum, p) =>
        sum +
        (p.pricing?.selling_price ?? 0) *
          (p.stock_management?.current_stock ?? 0),
      0,
    );
    return {
      sign: "₱",
      title: "Inventory Value",
      value: total.toLocaleString("en-PH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    };
  },
  total_stocks: (products) => ({
    sign: "",
    title: "Total Stocks",
    value: products.reduce(
      (sum, p) => sum + (p.stock_management?.current_stock ?? 0),
      0,
    ),
  }),
  items_on_floor: (products) => ({
    sign: "",
    title: "Items on Floor",
    value: products.reduce(
      (sum, p) => sum + (p.stock_management?.current_stock ?? 0),
      0,
    ),
  }),
  low_stock: (products) => ({
    sign: "",
    title: "Low Stock",
    value: products.filter(
      (p) =>
        (p.stock_management?.current_stock ?? 0) > 0 &&
        (p.stock_management?.current_stock ?? 0) <=
          (p.stock_management?.reorder_level ?? 0),
    ).length,
  }),
  out_of_stock: (products) => ({
    sign: "",
    title: "Out of Stock",
    value: products.filter(
      (p) => (p.stock_management?.current_stock ?? 0) === 0,
    ).length,
  }),
  updated_today: (products) => {
    const day_ago = Date.now() - 24 * 60 * 60 * 1000;
    return {
      sign: "",
      title: "Updated Today",
      value: products.filter((p) => {
        if (!p.updatedAt) return false;
        return new Date(p.updatedAt).getTime() > day_ago;
      }).length,
    };
  },
  total_products: (products) => ({
    sign: "",
    title: "Total Products",
    value: new Set(
      products.map((p) => String(p.product_id ?? p._id)),
    ).size,
  }),
  low_stock_alerts: (products) => ({
    sign: "",
    title: "Needs Restock",
    value: products.filter(
      (p) =>
        (p.stock_management?.current_stock ?? 0) <=
        (p.stock_management?.reorder_level ?? 0),
    ).length,
  }),
  branches: (products) => ({
    sign: "",
    title: "Branches",
    value: new Set(products.map((p) => String(p.branch?._id ?? p.branch))).size,
  }),
};

const InventoryLayout = ({ permissions = DEFAULTS }) => {
  const p = { ...DEFAULTS, ...permissions };

  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [modal, setModal] = useState(false);
  const [deleteAll, setDeleteAll] = useState(false);
  const [checkedRows, setCheckedRows] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const branch_id = p.can_switch_branch ? (selectedBranch?._id ?? null) : null;
  // Same cached list the table shows — stat cards stay in sync.
  const { data: products = [] } = useProducts(branch_id);
  const reload_products = () => queryClient.invalidateQueries({ queryKey: ["products"] });

  // ─── Compute stats from the cards list ─────────────────────
  // Only builds the cards this role asked for.
  const stats = useMemo(() => {
    return (p.cards || [])
      .map((key) => {
        const builder = CARD_BUILDERS[key];
        if (!builder) {
          console.warn(`Unknown card key: "${key}"`);
          return null;
        }
        return builder(products);
      })
      .filter(Boolean);
  }, [products, p.cards]);

  const handleDeleteAll = async () => {
    try {
      const { data } = await axios.delete("/api/products/bulk", {
        data: { ids: checkedRows },
      });
      if (!data.success) throw new Error(data.message);
      setDeleteAll(false);
      setCheckedRows([]);
      reload_products();
    } catch (error) {
      console.error("Delete all failed:", error.message);
    }
  };

  const FilterIcon = selected?.Icon ?? Funnel;
  const { handleExportCSV } = useExportCSV(products);
  const throttle_csv = useThrottle(handleExportCSV, 5000);

  return (
    <div className="relative w-full space-y-12 pt-3">
      <Header title="Inventory Management" />
      <div className="grid grid-cols-4 gap-2">
        {/* ─── Stat cards ─── */}
        {stats.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}

        {/* ─── Toolbar ─── */}
        <div className="col-span-4 pt-10 pb-2 flex justify-between items-center gap-2">
          <div className="flex justify-start items-center gap-4">
            <H4>Current Stocks</H4>
            {p.can_delete && (
              <Button
                variant="danger"
                size="md"
                className="w-fit"
                disabled={checkedRows.length === 0}
                onClick={() => setDeleteAll(true)}
              >
                <Trash2 size={16} />
                <span>
                  {checkedRows.length > 0
                    ? `Delete (${checkedRows.length})`
                    : "Delete Selected"}
                </span>
              </Button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {p.show_export && (
              <Button
                variant="secondary"
                size="md"
                className="w-fit gap-2"
                onClick={throttle_csv}
              >
                <Download size={16} />
                <span>Export</span>
              </Button>
            )}

            {p.can_switch_branch ? (
              <BranchDropdown
                onBranchSelect={(branch) => {
                  setSelectedBranch(branch);
                  setCheckedRows([]); // never act on rows you can no longer see
                }}
              />
            ) : (
              <BranchLabel />
            )}

            <div className="relative">
              <Button
                variant="secondary"
                size="md"
                className="w-fit gap-2"
                onClick={() => setOpen((prev) => !prev)}
              >
                <FilterIcon
                  size={20}
                  className={selected ? "text-blue-600" : "text-gray-600"}
                />
                {selected && (
                  <>
                    <span className="text-sm font-medium text-blue-600">
                      {selected.label}
                    </span>
                    <X
                      size={14}
                      className="text-gray-400 hover:text-gray-700"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelected(null);
                      }}
                    />
                  </>
                )}
              </Button>
              {open && (
                // Transparent layer closes the menu on outside click.
                <div className="fixed inset-0 z-[9]" onClick={() => setOpen(false)} />
              )}
              {open && (
                <div className="absolute top-full right-0 mt-1 w-52 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
                  {FILTER_OPTIONS.map(({ label, value, Icon }) => (
                    <button
                      key={value}
                      onClick={() => {
                        setSelected({ label, value, Icon });
                        setOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-2 text-sm transition-colors hover:bg-gray-50 ${
                        selected?.value === value
                          ? "text-blue-600 font-medium bg-blue-50"
                          : "text-gray-700"
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {p.can_add_product && (
              <Button
                variant="primary"
                size="md"
                className="w-fit gap-2"
                onClick={() => setModal(true)}
              >
                <Plus size={16} />
                <span>Add Product</span>
              </Button>
            )}
          </div>
        </div>

        {p.can_add_product && (
          <AddProductModal
            open={modal}
            onClose={() => setModal(false)}
            onSuccess={reload_products}
          />
        )}

        {deleteAll && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div
              className="absolute inset-0 bg-black/30 backdrop-blur-sm"
              onClick={() => setDeleteAll(false)}
            />
            <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-xl">
                  <Trash2 size={20} className="text-red-500" />
                </div>
                <div className="space-y-1">
                  <p className="text-base font-bold text-gray-900">
                    Delete {checkedRows.length} product
                    {checkedRows.length > 1 ? "s" : ""}?
                  </p>
                  <p className="text-sm text-gray-400">
                    This will permanently remove the selected products. This
                    cannot be undone.
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="md"
                  className="w-full"
                  onClick={() => setDeleteAll(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  className="w-full"
                  onClick={handleDeleteAll}
                >
                  Delete ({checkedRows.length})
                </Button>
              </div>
            </div>
          </div>
        )}

        <div className="col-span-4">
          <StocksCard
            key={branch_id ?? "all"}
            filter={selected?.value}
            branch_id={branch_id}
            permissions={p}
            selected={checkedRows}
            onSelectedChange={setCheckedRows}
          />
        </div>
      </div>
    </div>
  );
};

export default InventoryLayout;

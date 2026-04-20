import Header from "../components/header";
import { DashboardCard, StocksCard } from "../components/card";
import { Button } from "../components/buttons";
import { BranchDropdown } from "../components/dropdown";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowDownAZ,
  Funnel,
  ArrowDown10,
  ArrowDown01,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  Plus,
  Upload,
  AlertTriangle,
  Download,
  ArrowUp,
  X,
  Trash2,
  Store,
} from "lucide-react";
import { H2, H3, H4, H5 } from "../components/texts";
import { Add_Product_Modal } from "../components/modal";
import { COLUMNS } from "../constants/modal";
import { FILTER_OPTIONS } from "../constants/inventory";
import { useExportCSV } from "../hooks/use_export";
import { useThrottle } from "../hooks/use_throttle";

export const AdminInventory = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);
  const [modal, setModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [checkedRows, setCheckedRows] = useState([]);
  const [products, setProducts] = useState([]);
  const [deleteAll, setDeleteAll] = useState(false);

  const total_stocks = useMemo(() =>
    products.reduce(
      (sum, product) => sum + product.stock_management.current_stock,
      0,
    ),
  );

  const total_inventory_value = useMemo(() =>
    products.reduce(
      (sum, product) =>
        sum +
        product.pricing.selling_price * product.stock_management.current_stock,
      0,
    ),
  );

  const total_low_stocks = useMemo(
    () =>
      products.filter(
        (product) =>
          product.stock_management.current_stock <=
          product.stock_management.reorder_level,
      ).length,
    [products],
  );

  const STATS = [
    {
      sign: "₱",
      value: total_inventory_value,
      title: "Inventory Value (Selling Price)",
    },
    { sign: "", value: total_stocks, title: "Total Stocks" },
    { sign: "", value: total_low_stocks, title: "Low Stocks" },
    { sign: "", value: 0, title: "Completed Orders" },
  ];

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refresh]);

  const handleDeleteAll = async () => {
    console.log("checkedRows:", checkedRows); // ← is this empty?
    try {
      const res = await fetch("/api/products/bulk", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: checkedRows }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      setDeleteAll(false);
      setCheckedRows([]);
      setRefresh((prev) => prev + 1);
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
        {STATS.map((stat) => (
          <DashboardCard key={stat.title} {...stat} value={stat.value} />
        ))}

        <Add_Product_Modal
          open={modal}
          onClose={() => setModal(false)}
          onSuccess={() => setRefresh((prev) => prev + 1)}
        />
        <div className="col-span-4 pt-10 pb-2 flex justify-between items-center gap-2">
          <div className="flex justify-start items-center gap-4">
            <H4>Current Stocks</H4>
            <div className="">
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
                          This will permanently remove the selected products.
                          This cannot be undone.
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
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* Export CSV */}
            <Button
              variant="secondary"
              size="md"
              className="w-fit gap-2"
              onClick={throttle_csv}
            >
              <Download size={16} />
              <span>Export</span>
            </Button>
            {/* Branches */}
            <BranchDropdown
              onBranchSelect={(branch) =>
                console.log("selected branch:", branch)
              }
            />
            {/* Filter */}
            <div className="relative" ref={dropdownRef}>
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
            {/* Add Product */}
            <Button
              variant="primary"
              size="md"
              className="w-fit gap-2"
              onClick={() => setModal(true)}
            >
              <Plus size={16} />
              <span>Add Product</span>
            </Button>
          </div>
        </div>

        <Add_Product_Modal
          open={modal}
          onClose={() => setModal(false)}
          onSuccess={() => setRefresh((prev) => prev + 1)}
        />

        <Add_Product_Modal
          open={modal}
          onClose={() => setModal(false)}
          onSuccess={() => setRefresh((prev) => prev + 1)}
        />
        <div className="col-span-4">
          <StocksCard
            filter={selected?.value}
            columns={COLUMNS}
            refresh={refresh}
            setCheckedRows={checkedRows}
            onProductsChange={(data) => setProducts(data)}
            onProductsLoaded={(data) => setProducts(data)}
            onCheckedChange={(rows) => setCheckedRows(rows)}
          />
        </div>
      </div>
    </div>
  );
};

import Header from "../components/header";
import { DashboardCard, StocksCard } from "../components/card";
import { Button } from "../components/buttons";
import { useEffect, useRef, useState } from "react";
import {
  ArrowDownAZ,
  Funnel,
  ArrowDown10,
  ArrowDown01,
  ArrowDownNarrowWide,
  ArrowDownWideNarrow,
  Plus,
  Download,
  ArrowUp,
} from "lucide-react";
import { H2, H3, H4, H5 } from "../components/texts";
import { Add_Product_Modal } from "../components/modal";
import { COLUMNS } from "../constants/modal";
import { FILTER_OPTIONS } from "../constants/inventory";
import { useExportCSV } from "../hooks/use_export";

const STATS = [
  { sign: "₱", title: "Total Stocks" },
  { sign: "₱", title: "Low Stocks" },
  { sign: "₱", title: "Orders" },
  { sign: "", title: "Inventory Value" },
];

export const AdminInventory = () => {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const dropdownRef = useRef(null);
  const [modal, setModal] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [checkedRows, setCheckedRows] = useState([]);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [refresh]);

  const FilterIcon = selected?.Icon ?? Funnel;

  const { handleExportCSV } = useExportCSV(products);

  return (
    <div className="relative w-full space-y-12 pt-3">
      <Header title="Inventory Management" />
      <div className="grid grid-cols-4 gap-2">
        {STATS.map((stat) => (
          <DashboardCard key={stat.title} {...stat} />
        ))}

        <Add_Product_Modal
          open={modal}
          onClose={() => setModal(false)}
          onSuccess={() => setRefresh((prev) => prev + 1)}
        />
        <div className="col-span-4 pt-10 pb-2 flex justify-between items-center gap-2">
          <H4>Current Stocks</H4>
          <div className="flex justify-center items-center gap-2">
            {/* Bulk Delete — only when rows are checked */}
            {checkedRows.length > 0 && (
              <Button
                variant="danger"
                size="md"
                className="w-fit gap-2"
                onClick={() => setBulkDeleteModal(true)}
              >
                <Trash2 size={16} />
                <span>Delete ({checkedRows.length})</span>
              </Button>
            )}

            {/* Export CSV */}
            <Button
              variant="secondary"
              size="md"
              className="w-fit gap-2"
              onClick={handleExportCSV}
            >
              <Download size={16} />
              <span>Export CSV</span>
            </Button>

            {/* Filter */}
            <div className="relative" ref={dropdownRef}>
              <Button
                variant="secondary"
                size="md"
                className="w-fit gap-2"
                onClick={() => setOpen((prev) => !prev)}
              >
                <FilterIcon
                  size={16}
                  className={selected ? "text-blue-600" : "text-gray-600"}
                />
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
                      className={`w-full flex items-center gap-3 px-4 py-2 text-base transition-colors hover:bg-gray-50 ${
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
        <div className="col-span-4">
          <StocksCard
            filter={selected?.value}
            columns={COLUMNS}
            refresh={refresh}
            setCheckedRows={setCheckedRows}
            onProductsLoaded={(data) => setProducts(data)}
          />
        </div>
      </div>
    </div>
  );
};

import React, { useEffect, useState } from "react";
import { H2, H3, H6, Paragraph } from "./texts";
import {
  ArrowLeftRight,
  ChevronDown,
  ChevronRight,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { sortProducts } from "../utils/sort";
import { StockBadge } from "./badge";
import { EditableName } from "./editable_name";
import { EditableBarcode } from "./editable_barcode";
import { EditableStock } from "./editable_stock";
import { EditableSupplier } from "./editable_supplier";
import { EditableCategory } from "./editable_category";
import { EditablePrice } from "./editable_price";
import axios from "axios";

export const DashboardCard = ({ title, card_icon, sign, value }) => (
  <div className="bg-white w-full h-[180px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
    <div className="flex justify-between items-start">
      <H6 className="text-gray-500 font-medium uppercase tracking-wider">
        {title}
      </H6>
      <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
        <TrendingUp size={20} />
        {card_icon}
      </div>
    </div>
    <div className="flex items-center gap-2">
      {sign && <H3 className="text-slate-800 font-bold">{sign}</H3>}
      <H2 className="font-bold text-slate-800">{value}</H2>
    </div>
    <div className="flex justify-start items-center">
      <Paragraph
        variant="muted"
        className="text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full w-fit"
      >
        +12.5%
      </Paragraph>
      <Paragraph variant="muted" className="px-2 py-0.5 rounded-full w-fit">
        Increased from last month
      </Paragraph>
    </div>
  </div>
);

// ── Chart Card ──────────────────────────────────────────────────
export const ChartCard = ({}) => {
  return (
    <div className="bg-white w-full h-[420px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <H6 className="text-gray-500 font-medium uppercase tracking-wider">
          Sales Analytics
        </H6>
      </div>
    </div>
  );
};

// ── Group products by product_id ────────────────────────────────
const groupProducts = (products) => {
  const map = new Map();
  products.forEach((p) => {
    const key = p.product_id ?? p._id;
    if (!map.has(key)) {
      map.set(key, { ...p, branches: [p] });
    } else {
      map.get(key).branches.push(p);
    }
  });
  return Array.from(map.values());
};

const BranchTag = ({ name }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
    {name}
  </span>
);

// ── Stocks Card ─────────────────────────────────────────────────
export const StocksCard = ({
  filter,
  refresh,
  onProductsLoaded,
  onCheckedChange,
  onProductsChange,
  branch_id,
  user_role, // ← pass this from your auth context
}) => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [expanded, setExpanded] = useState({});

  // ── Role permission flags ──
  const can_edit_all = ["owner", "admin"].includes(user_role);
  const can_edit_branch = ["owner", "admin", "branch_manager"].includes(
    user_role,
  );
  const isAllBranches = !branch_id && can_edit_all;

  const is_employee = user_role === "employee";

  // ── Dynamic headers based on view + role ──
  const allBranchesHeaders = [
    "Photo",
    "Product Name",
    "Barcode",
    "Category",
    "Stock Level",
    "Quantity",
    "Actions",
  ];
  const branchHeaders = [
    "Photo",
    "Product Name",
    "Barcode",
    "Category",
    "Stock Level",
    "Quantity",
    // Only show Supplier & Price columns if branch_manager or above
    ...(can_edit_branch ? ["Supplier", "Selling Price"] : []),
    "Actions",
  ];
  const headers = isAllBranches ? allBranchesHeaders : branchHeaders;

  // ── Fetch — backend scopes by branch automatically via middleware ──
  const fetch_products = async () => {
    setLoading(true);
    try {
      const url = branch_id
        ? `/api/products?branch_id=${branch_id}`
        : "/api/products";

      const { data } = await axios.get(url);
      setProducts(data.products);
      onProductsLoaded?.(data.products);
      const initial = {};
      data.products.forEach((p) => {
        initial[p._id] = p.stock_management.current_stock;
      });
      setQuantities(initial);
    } catch (error) {
      console.error("fetch_products error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_products();
  }, [refresh, branch_id]);
  useEffect(() => {
    onCheckedChange?.(selected);
  }, [selected]);
  useEffect(() => {
    onProductsChange?.(products);
  }, [products]);
  useEffect(() => {
    setExpanded({});
  }, [branch_id]);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const toggleAll = () =>
    setSelected(
      selected.length === products.length ? [] : products.map((p) => p._id),
    );

  const toggleExpand = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  const updateProduct = (id, changes) =>
    setProducts((prev) =>
      prev.map((p) => (p._id === id ? { ...p, ...changes } : p)),
    );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const { data } = await axios.delete(`/api/products/${id}`);
      if (!data.success) throw new Error(data.message);
      await fetch_products();
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  const sorted = sortProducts(products, filter);
  const grouped = isAllBranches ? groupProducts(sorted) : null;

  // ── Flat row — specific branch selected ──
  const renderFlatRow = (product) => (
    <tr
      key={product._id}
      className={`hover:bg-gray-50 transition-colors ${selected.includes(product._id) ? "bg-blue-50/40" : ""}`}
    >
      <td className="px-4 py-3">
        <input
          type="checkbox"
          checked={selected.includes(product._id)}
          onChange={() => toggleSelect(product._id)}
          className="rounded"
        />
      </td>
      <td className="px-4 py-3">
        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
          {product.photo ? (
            <img
              src={product.photo}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-lg">📦</span>
          )}
        </div>
      </td>
      <td className="px-4 py-3">
        {/* Owner/admin can edit name, employee sees plain text */}
        {can_edit_all ? (
          <EditableName
            productId={product._id}
            name={product.name}
            brand={product.brand}
            onUpdate={(form) => updateProduct(product._id, form)}
          />
        ) : (
          <span className="text-sm font-medium text-gray-700">
            {product.name}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {can_edit_branch ? (
          <EditableBarcode
            productId={product._id}
            barcode={product.barcode}
            onUpdate={(v) => updateProduct(product._id, { barcode: v })}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {product.barcode ?? "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {can_edit_all ? (
          <EditableCategory
            productId={product._id}
            category={product.category}
            onUpdate={(v) => updateProduct(product._id, { category: v })}
          />
        ) : (
          <span className="text-sm text-gray-600">
            {product.category ?? "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        <StockBadge
          current={
            quantities[product._id] ?? product.stock_management.current_stock
          }
          reorder={product.stock_management.reorder_level}
        />
      </td>
      <td className="px-4 py-3">
        <EditableStock
          productId={product._id}
          stock_management={product.stock_management}
          onUpdate={(updated) => {
            setQuantities((prev) => ({
              ...prev,
              [product._id]: Number(updated.current_stock),
            }));
            updateProduct(product._id, {
              stock_management: {
                ...product.stock_management,
                ...updated,
                current_stock: Number(updated.current_stock),
              },
            });
          }}
        />
      </td>

      {/* Supplier & Price — branch_manager and above only */}
      {can_edit_branch && (
        <>
          <td className="px-4 py-3 whitespace-nowrap">
            <EditableSupplier
              productId={product._id}
              supplier={product.stock_management.supplier}
              onUpdate={(v) =>
                updateProduct(product._id, {
                  stock_management: {
                    ...product.stock_management,
                    supplier: v,
                  },
                })
              }
            />
          </td>
          <td className="px-4 py-3 whitespace-nowrap">
            <EditablePrice
              productId={product._id}
              pricing={product.pricing}
              onUpdate={(updated) =>
                updateProduct(product._id, {
                  pricing: { ...product.pricing, ...updated },
                })
              }
            />
          </td>
        </>
      )}

      <td className="px-4 py-3">
        <div className="flex items-center gap-1">
          {/* Delete — owner/admin only */}
          {can_edit_all && (
            <button
              className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
              onClick={() => handleDelete(product._id)}
            >
              <Trash2 size={15} />
            </button>
          )}
          <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
            <ArrowLeftRight size={15} />
          </button>
        </div>
      </td>
    </tr>
  );

  // ── Grouped row — all branches ──
  const renderGroupedRow = (group) => {
    const key = group.product_id ?? group._id;
    const isExpanded = expanded[key];

    const totalStock = group.branches.reduce(
      (sum, branch) =>
        sum + (quantities[branch._id] ?? branch.stock_management.current_stock),
      0,
    );
    const lowestReorder = Math.max(
      ...group.branches.map((branch) => branch.stock_management.reorder_level),
    );

    return (
      <React.Fragment key={key}>
        {/* ── Parent row ── */}
        <tr
          className={`transition-colors cursor-pointer ${
            selected.includes(group._id) ? "bg-blue-50/40" : "hover:bg-gray-50"
          }`}
          onClick={() => toggleExpand(key)}
        >
          <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
            <input
              type="checkbox"
              checked={selected.includes(group._id)}
              onChange={() => toggleSelect(group._id)}
              className="rounded"
            />
          </td>
          <td className="px-4 py-3">
            <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden">
              {group.photo ? (
                <img
                  src={group.photo}
                  alt={group.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-lg">📦</span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              {isExpanded ? (
                <ChevronDown size={14} className="text-gray-400" />
              ) : (
                <ChevronRight size={14} className="text-gray-400" />
              )}
              {can_edit_all ? (
                <EditableName
                  productId={group._id}
                  name={group.name}
                  brand={group.brand}
                  onUpdate={(form) => updateProduct(group._id, form)}
                />
              ) : (
                <span className="text-sm font-medium text-gray-700">
                  {group.name}
                </span>
              )}
            </div>
          </td>
          <td className="px-4 py-3">
            <span className="text-sm text-gray-600">
              {group.barcode ?? "—"}
            </span>
          </td>
          <td className="px-4 py-3">
            <span className="text-sm text-gray-600">
              {group.category ?? "—"}
            </span>
          </td>
          <td className="px-4 py-3">
            <StockBadge current={totalStock} reorder={lowestReorder} />
          </td>
          <td className="px-4 py-3">
            <span className="text-sm font-medium text-gray-700">
              {totalStock}
            </span>
            {group.branches.length > 1 && (
              <span className="text-xs text-gray-400 ml-1">
                ({group.branches.length} branches)
              </span>
            )}
          </td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-1">
              {can_edit_all && (
                <button
                  className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDelete(group._id);
                  }}
                >
                  <Trash2 size={15} />
                </button>
              )}
              <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                <ArrowLeftRight size={15} />
              </button>
            </div>
          </td>
        </tr>

        {/* ── Expanded branch breakdown rows ── */}
        {isExpanded &&
          group.branches.map((b) => (
            <tr
              key={b._id}
              className="bg-indigo-50/30 border-l-2 border-indigo-200"
            >
              <td className="px-4 py-2" />
              <td className="px-4 py-2" />
              <td className="px-4 py-2 pl-8">
                <BranchTag name={b.branch?.name ?? "Branch"} />
              </td>
              <td className="px-4 py-2">
                <span className="text-xs text-gray-500">
                  {b.barcode ?? "—"}
                </span>
              </td>
              <td className="px-4 py-2">
                <span className="text-xs text-gray-500">
                  {b.category ?? "—"}
                </span>
              </td>
              <td className="px-4 py-2">
                <StockBadge
                  current={
                    quantities[b._id] ?? b.stock_management.current_stock
                  }
                  reorder={b.stock_management.reorder_level}
                />
              </td>
              <td className="px-4 py-2">
                <span className="text-xs font-medium text-gray-600">
                  {quantities[b._id] ?? b.stock_management.current_stock}
                </span>
              </td>
              <td className="px-4 py-2" />
            </tr>
          ))}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="overflow-x-auto min-w-[900px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="px-4 py-3 text-left w-10">
                <input
                  type="checkbox"
                  checked={
                    selected.length === products.length && products.length > 0
                  }
                  onChange={toggleAll}
                  className="rounded"
                />
              </th>
              {headers.map((label) => (
                <th
                  key={label}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: headers.length + 1 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : isAllBranches
                ? grouped.map((group) => renderGroupedRow(group))
                : sorted.map((product) => renderFlatRow(product))}
          </tbody>
        </table>

        {!loading && sorted.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">No products found</p>
          </div>
        )}
      </div>
    </div>
  );
};

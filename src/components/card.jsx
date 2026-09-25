import React, { useState } from "react";
import { useProducts } from "../hooks/use_product_lookup";
import { queryClient } from "../lib/query";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowUpRight,
  ChevronDown,
  ChevronRight,
  Trash2,
  TrendingUp,
} from "lucide-react";
import axios from "axios";

import { H2, H3, H6, Paragraph } from "./texts";
import { sortProducts } from "../utils/sort";
import { StockBadge } from "./badge";
import { EditableName } from "./editable_name";
import { EditableBarcode } from "./editable_barcode";
import { EditableStock } from "./editable_stock";
import { EditableSupplier } from "./editable_supplier";
import { EditableCategory } from "./editable_category";
import { EditablePrice } from "./editable_price";

// `change` (a number, percent) and `hint` are optional. When `change`
// is provided we render a colored up/down trend badge; otherwise the
// footer just shows `hint` (or nothing). `icon` overrides the default.
export const DashboardCard = ({
  title,
  icon,
  sign,
  value,
  change,
  hint,
  loading = false,
}) => {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  const up = (change ?? 0) >= 0;

  return (
    <div className="bg-white w-full h-[180px] p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <H6 className="text-gray-500 font-medium uppercase tracking-wider">
          {title}
        </H6>
        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
          {icon ?? <TrendingUp size={20} />}
        </div>
      </div>

      {loading ? (
        <div className="h-9 w-28 bg-gray-100 rounded animate-pulse" />
      ) : (
        <div className="flex items-center gap-2">
          {sign && <H3 className="text-slate-800 font-bold">{sign}</H3>}
          <H2 className="font-bold text-slate-800">{value}</H2>
        </div>
      )}

      <div className="flex items-center gap-2">
        {hasChange && (
          <span
            className={`inline-flex items-center gap-0.5 text-xs font-bold px-2 py-0.5 rounded-full w-fit ${
              up
                ? "text-green-600 bg-green-100"
                : "text-red-600 bg-red-100"
            }`}
          >
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {up ? "+" : ""}
            {change}%
          </span>
        )}
        {hint && (
          <Paragraph variant="muted" className="text-xs">
            {hint}
          </Paragraph>
        )}
      </div>
    </div>
  );
};

// Deterministic dummy 14-day series, used as a placeholder when there's
// no real sales data yet so the chart never looks empty in a demo.
const buildDummySeries = () => {
  const shape = [12, 18, 9, 22, 31, 26, 41, 34, 28, 47, 52, 39, 60, 55];
  const pad = (n) => String(n).padStart(2, "0");
  const today = new Date();
  return shape.map((v, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (shape.length - 1 - i));
    return {
      date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
      sales: v * 95 + (i % 3) * 60,
      orders: Math.max(1, Math.round(v / 4)),
    };
  });
};

// Lightweight, dependency-free bar chart for the daily sales series.
export const ChartCard = ({ series = [], loading = false }) => {
  const realTotal = series.reduce((s, d) => s + d.sales, 0);
  const isDummy = !loading && realTotal === 0;
  const data = isDummy ? buildDummySeries() : series;

  const max = Math.max(1, ...data.map((d) => d.sales));
  const totalSales = data.reduce((s, d) => s + d.sales, 0);
  const totalOrders = data.reduce((s, d) => s + d.orders, 0);

  // Geometry in a 0–100 coordinate space (6% top / bottom padding).
  const n = data.length;
  const points = data.map((d, i) => ({
    x: n > 1 ? (i / (n - 1)) * 100 : 50,
    y: 94 - (d.sales / max) * 88,
    d,
  }));
  const linePath = points
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`)
    .join(" ");
  const areaPath = points.length
    ? `${linePath} L ${points[n - 1].x.toFixed(2)} 100 L ${points[0].x.toFixed(2)} 100 Z`
    : "";

  return (
    <div className="bg-white w-full h-[420px] p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col">
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-2">
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">
            Sales Analytics
          </H6>
          {isDummy && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-700">
              Sample data
            </span>
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400">Last 14 days</p>
          <p className="text-sm font-semibold text-slate-700">
            ₱{totalSales.toLocaleString()} · {totalOrders} orders
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex-1 mt-6 bg-gray-100 rounded-lg animate-pulse" />
      ) : (
        <div className="flex-1 mt-6 flex flex-col">
          {/* Plot */}
          <div className="relative flex-1">
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 w-full h-full overflow-visible"
            >
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d={areaPath}
                fill="url(#salesGrad)"
                className={isDummy ? "opacity-50" : ""}
              />
              <path
                d={linePath}
                fill="none"
                stroke="#6366f1"
                strokeWidth="2"
                strokeLinejoin="round"
                strokeLinecap="round"
                vectorEffect="non-scaling-stroke"
                className={isDummy ? "opacity-50" : ""}
              />
            </svg>

            {/* Hover dots (kept circular via an HTML overlay) */}
            <div className="absolute inset-0">
              {points.map((p) => {
                const label = p.d.date.slice(5);
                return (
                  <span
                    key={p.d.date}
                    title={`${label}: ₱${p.d.sales.toLocaleString()} (${p.d.orders} orders)`}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    className={`absolute w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white border-2 cursor-pointer transition-transform hover:scale-150 ${
                      isDummy ? "border-indigo-300" : "border-indigo-500"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* X-axis labels */}
          <div className="flex mt-2">
            {data.map((d) => (
              <span
                key={d.date}
                className="flex-1 text-center text-[9px] text-gray-400"
              >
                {d.date.slice(8)}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const groupProducts = (products) => {
  const map = new Map();
  products.forEach((p) => {
    const key = p.product_id ?? p._id;
    if (!map.has(key)) map.set(key, { ...p, branches: [p] });
    else map.get(key).branches.push(p);
  });
  return Array.from(map.values());
};

const formatPrice = (value) => {
  if (value == null || value === "") return "—";
  const num = Number(value);
  if (Number.isNaN(num)) return "—";
  return `₱${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const BranchTag = ({ name }) => (
  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-indigo-50 text-indigo-600 border border-indigo-100">
    <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
    {name}
  </span>
);

const DEFAULT_PERMISSIONS = {
  show_checkbox: false,
  show_actions: false,
  can_delete_row: false,
  show_branch_breakdown: false, // ⬅️ NEW: gates the expandable grouped-row view
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

// Products come from the shared ["products", branch] cache (same data
// the parent uses for its stat cards). Row selection is controlled by the
// parent. Remount with key={branch} to reset expanded rows.
const NO_ROWS = [];

export const StocksCard = ({
  filter,
  selected = NO_ROWS,
  onSelectedChange = () => {},
  branch_id,
  permissions = DEFAULT_PERMISSIONS,
}) => {
  const { data: products = NO_ROWS, isPending: loading } = useProducts(branch_id);
  const [expanded, setExpanded] = useState({});

  const p = permissions;

  // ⬇️ CHANGED: was `!branch_id && p.show?.cost_price` (loose check)
  // Now explicit: only show grouped/expandable rows when role allows AND no specific branch is selected.
  const isAllBranches = p.show_branch_breakdown && !branch_id;

  const headers = [
    "Photo",
    "Product Name",
    "Barcode",
    "Category",
    "Stock Level",
    "Quantity",
    ...(!isAllBranches && p.show?.supplier ? ["Supplier"] : []),
    ...(!isAllBranches && p.show?.cost_price ? ["Cost Price"] : []),
    ...(!isAllBranches && p.show?.selling_price ? ["Selling Price"] : []),
    ...(p.show_actions ? ["Actions"] : []),
  ];

  const toggleSelect = (id) =>
    onSelectedChange(
      selected.includes(id) ? selected.filter((i) => i !== id) : [...selected, id],
    );
  const toggleAll = () =>
    onSelectedChange(
      selected.length === products.length ? [] : products.map((prod) => prod._id),
    );
  const toggleExpand = (key) =>
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  // Inline edits update every cached copy of the product (all branches
  // views, POS) instead of re-fetching.
  const updateProduct = (id, changes) =>
    queryClient.setQueriesData({ queryKey: ["products"] }, (d) =>
      d?.products
        ? { ...d, products: d.products.map((prod) => (prod._id === id ? { ...prod, ...changes } : prod)) }
        : d,
    );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const { data } = await axios.delete(`/api/products/${id}`);
      if (!data.success) throw new Error(data.message);
      queryClient.invalidateQueries({ queryKey: ["products"] });
      onSelectedChange(selected.filter((s) => s !== id));
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  const sorted = sortProducts(products, filter);
  const grouped = isAllBranches ? groupProducts(sorted) : null;

  // ─── Flat row (default — no branch breakdown) ────────────
  const renderFlatRow = (product) => (
    <tr
      key={product._id}
      className={`hover:bg-gray-50 transition-colors ${selected.includes(product._id) ? "bg-blue-50/40" : ""}`}
    >
      {p.show_checkbox && (
        <td className="px-4 py-3">
          <input
            type="checkbox"
            checked={selected.includes(product._id)}
            onChange={() => toggleSelect(product._id)}
            className="rounded"
          />
        </td>
      )}
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
        {p.edit?.name ? (
          <EditableName
            productId={product._id}
            name={product.name}
            brand={product.brand}
            onUpdate={(form) => updateProduct(product._id, form)}
          />
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-700">
              {product.name}
            </span>
            <span className="text-xs text-gray-400">{product.brand}</span>
          </div>
        )}
      </td>
      <td className="px-4 py-3">
        {p.edit?.barcode ? (
          <EditableBarcode
            productId={product._id}
            barcode={product.barcode}
            onUpdate={(v) => updateProduct(product._id, { barcode: v })}
          />
        ) : (
          <span className="text-sm font-mono text-gray-600">
            {product.barcode ?? "—"}
          </span>
        )}
      </td>
      <td className="px-4 py-3">
        {p.edit?.category ? (
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
            product.stock_management.current_stock
          }
          reorder={product.stock_management.reorder_level}
        />
      </td>
      <td className="px-4 py-3">
        {p.edit?.stock ? (
          <EditableStock
            productId={product._id}
            name={product.name}
            cost={product.pricing?.cost_per_unit}
            stock_management={product.stock_management}
            onUpdate={(updated) => {
              updateProduct(product._id, {
                stock_management: {
                  ...product.stock_management,
                  ...updated,
                  current_stock: Number(updated.current_stock),
                },
              });
            }}
          />
        ) : (
          <span className="text-sm text-gray-700">
            {product.stock_management.current_stock}
          </span>
        )}
      </td>
      {p.show?.supplier && (
        <td className="px-4 py-3 whitespace-nowrap">
          {p.edit?.supplier ? (
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
          ) : (
            <span className="text-sm text-gray-600">
              {product.stock_management.supplier || "—"}
            </span>
          )}
        </td>
      )}
      {p.show?.cost_price && (
        <td className="px-4 py-3 whitespace-nowrap">
          {p.edit?.cost_price ? (
            <EditablePrice
              productId={product._id}
              pricing={product.pricing}
              field="cost_price"
              onUpdate={(updated) =>
                updateProduct(product._id, {
                  pricing: { ...product.pricing, ...updated },
                })
              }
            />
          ) : (
            <span className="text-sm text-gray-700">
              {formatPrice(product.pricing?.cost_per_unit)}
            </span>
          )}
        </td>
      )}
      {p.show?.selling_price && (
        <td className="px-4 py-3 whitespace-nowrap">
          <span className="text-sm font-medium text-gray-900">
            {formatPrice(product.pricing?.selling_price)}
          </span>
        </td>
      )}
      {p.show_actions && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            {p.can_delete_row && (
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
      )}
    </tr>
  );

  // ─── Grouped row (admin only — all-branches view) ────────
  const renderGroupedRow = (group) => {
    const key = group.product_id ?? group._id;
    const isExpanded = expanded[key];
    const totalStock = group.branches.reduce(
      (sum, branch) =>
        sum + (branch.stock_management.current_stock),
      0,
    );
    const lowestReorder = Math.max(
      ...group.branches.map((branch) => branch.stock_management.reorder_level),
    );

    return (
      <React.Fragment key={key}>
        <tr
          className={`transition-colors cursor-pointer ${selected.includes(group._id) ? "bg-blue-50/40" : "hover:bg-gray-50"}`}
          onClick={() => toggleExpand(key)}
        >
          {p.show_checkbox && (
            <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
              <input
                type="checkbox"
                checked={selected.includes(group._id)}
                onChange={() => toggleSelect(group._id)}
                className="rounded"
              />
            </td>
          )}
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
              {p.edit?.name ? (
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
            {p.edit?.barcode ? (
              <EditableBarcode
                productId={group._id}
                barcode={group.barcode}
                onUpdate={(v) => updateProduct(group._id, { barcode: v })}
              />
            ) : (
              <span className="text-sm font-mono text-gray-600">
                {group.barcode ?? "—"}
              </span>
            )}
          </td>
          <td className="px-4 py-3">
            {p.edit?.category ? (
              <EditableCategory
                productId={group._id}
                category={group.category}
                onUpdate={(v) => updateProduct(group._id, { category: v })}
              />
            ) : (
              <span className="text-sm text-gray-600">
                {group.category ?? "—"}
              </span>
            )}
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
          {p.show_actions && (
            <td className="px-4 py-3">
              <div className="flex items-center gap-1">
                {p.can_delete_row && (
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
          )}
        </tr>

        {/* ⬇️ CHANGED: branch sub-rows now show only Branch + Quantity + Status (per your request) */}
        {isExpanded &&
          group.branches.map((b) => {
            const branchStock =
              b.stock_management.current_stock;
            return (
              <tr
                key={b._id}
                className="bg-indigo-50/30 border-l-2 border-indigo-200"
              >
                {p.show_checkbox && <td className="px-4 py-2" />}
                <td className="px-4 py-2" />
                <td className="px-4 py-2 pl-8">
                  <BranchTag name={b.branch?.name ?? "Branch"} />
                </td>
                <td className="px-4 py-2" />
                <td className="px-4 py-2" />
                <td className="px-4 py-2">
                  <StockBadge
                    current={branchStock}
                    reorder={b.stock_management.reorder_level}
                  />
                </td>
                <td className="px-4 py-2">
                  <span className="text-xs font-medium text-gray-600">
                    {branchStock}
                  </span>
                </td>
                {/* Removed: actions column */}
              </tr>
            );
          })}
      </React.Fragment>
    );
  };

  return (
    <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="overflow-x-auto min-w-[900px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {p.show_checkbox && (
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
              )}
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
                    {Array.from({
                      length: headers.length + (p.show_checkbox ? 1 : 0),
                    }).map((_, j) => (
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

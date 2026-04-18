import React, { useEffect, useState } from "react";
import { H2, H3, H4, H5, H6, Paragraph } from "./texts";
import { ArrowLeftRight, Pencil, Trash2, TrendingUp } from "lucide-react"; // Added for visual flair
import { sortProducts } from "../utils/sort";
import { StockBadge } from "./badge";
import { useDebounce } from "../hooks/use_debounce";
import { Edit_Product_Modal } from "./modal";
import { EditableBarcode } from "./editable_barcode";
import { EditableCategory } from "./editable_category";
import { EditableStock } from "./editable_unit";
import { EditableName } from "./editable_name";
import { EditablePrice } from "./editable_price";
import { EditableSupplier } from "./editable_supplier";

export const DashboardCard = ({ title, card_icon, sign, value }) => {
  return (
    <div className="bg-white w-full h-[180px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-1">
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">
            {title}
          </H6>
        </div>
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
          className={`text-xs font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded-full w-fit`}
        >
          +12.5%
        </Paragraph>
        <Paragraph variant="muted" className="px-2 py-0.5 rounded-full w-fit">
          Increased from last month
        </Paragraph>
      </div>
    </div>
  );
};

export const ChartCard = ({}) => {
  return (
    <div className="bg-white w-full h-[420px] p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="flex justify-between items-start">
        <div className="flex justify-between items-start">
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">
            Sales Analytics
            {/* {dashboard_card_title} */}
          </H6>
        </div>
      </div>
    </div>
  );
};

const QuantityControl = ({ product_id, value, onChange }) => {
  const update_stock = useDebounce(async (id, newValue) => {
    try {
      const res = await fetch(`/api/products/${id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_stock: newValue }),
      });
      const data = await res.json();
      if (!data.success) console.error("Stock update failed:", data.message);
    } catch (err) {
      console.error("Stock update error:", err);
    }
  }, 600);

  const handleChange = (new_value) => {
    onChange(new_value);
    update_stock(new_value);
  };

  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => handleChange(Math.max(0, value - 1))}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
      >
        −
      </button>
      <span className="w-8 text-center text-sm font-medium">{value}</span>
      <button
        onClick={() => handleChange(value + 1)}
        className="w-6 h-6 rounded-md bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-600 font-medium transition-colors"
      >
        +
      </button>
    </div>
  );
};

export const StocksCard = ({ filter, columns, refresh, onProductsLoaded }) => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);
  const [editProduct, setEditProduct] = useState(null);

  const fetch_products = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      setProducts(data.products);
      onProductsLoaded?.(data.products);
      const initial = {};
      data.products.forEach((product) => {
        initial[product._id] = product.stock_management.current_stock;
      });
      setQuantities(initial);
    } catch (error) {
      console.log("error:", error);
    } finally {
      console.log("finally reached"); // ← check this prints
      setLoading(false);
    }
  };

  useEffect(() => {
    fetch_products();
  }, [refresh]);

  const toggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const toggleAll = () =>
    setSelected(
      selected.length === products.length
        ? []
        : products.map((product) => product._id),
    );

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?"))
      return;
    try {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      console.log("Deleted — refetching...");
      await fetch_products();
      console.log("Refetch done");
    } catch (err) {
      console.error("Delete failed:", err.message);
    }
  };

  const sorted = sortProducts(products, filter);

  return (
    <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="overflow-x-auto min-w-[900px]">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              {/* 1. The checkbox gets its own header cell */}
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

              {/* 2. Map the columns into their own separate <th> cells */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    {Array.from({ length: columns.length + 1 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-gray-100 rounded w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              : sorted.map((product) => (
                  <tr
                    key={product._id}
                    className={`hover:bg-gray-50 transition-colors ${
                      selected.includes(product._id) ? "bg-blue-50/40" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selected.includes(product._id)}
                        onChange={() => toggleSelect(product._id)}
                        className="rounded"
                      />
                    </td>

                    {/* Photo */}
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
                      <EditableName
                        productId={product._id}
                        name={product.name}
                        brand={product.brand}
                        onUpdate={({ name, brand }) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id ? { ...p, name, brand } : p,
                            ),
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <EditableBarcode
                        productId={product._id}
                        barcode={product.barcode}
                        onUpdate={(newBarcode) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id
                                ? { ...p, barcode: newBarcode }
                                : p,
                            ),
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <EditableCategory
                        productId={product._id}
                        category={product.category}
                        onUpdate={(newCategory) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id
                                ? { ...p, category: newCategory }
                                : p,
                            ),
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3">
                      <StockBadge
                        current={
                          quantities[product._id] ??
                          product.stock_management.current_stock
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
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id
                                ? {
                                    ...p,
                                    stock_management: {
                                      ...p.stock_management,
                                      ...updated,
                                    },
                                  }
                                : p,
                            ),
                          );
                        }}
                      />
                    </td>

                    <td className="px-4 py-3 text-sm text-gray-600 whitespace-nowrap">
                      <EditableSupplier
                        productId={product._id}
                        supplier={product.stock_management.supplier}
                        onUpdate={(newSupplier) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id
                                ? {
                                    ...p,
                                    stock_management: {
                                      ...p.stock_management,
                                      supplier: newSupplier,
                                    },
                                  }
                                : p,
                            ),
                          )
                        }
                      />
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      <EditablePrice
                        productId={product._id}
                        pricing={product.pricing}
                        onUpdate={(updated) =>
                          setProducts((prev) =>
                            prev.map((p) =>
                              p._id === product._id
                                ? {
                                    ...p,
                                    pricing: { ...p.pricing, ...updated },
                                  }
                                : p,
                            ),
                          )
                        }
                      />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {/* <button
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          onClick={() => setEditProduct(product)}
                        >
                          <Pencil size={15} />
                        </button> */}
                        <button
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                          onClick={() => {
                            handleDelete(product._id);
                          }}
                        >
                          <Trash2 size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 transition-colors">
                          <ArrowLeftRight size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
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

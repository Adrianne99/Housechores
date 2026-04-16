import React, { useEffect, useState } from "react";
import { H2, H3, H4, H5, H6, Paragraph } from "./texts";
import { ArrowLeftRight, Pencil, Trash2, TrendingUp } from "lucide-react"; // Added for visual flair
import { sortProducts } from "../utils/sort";
import { StockBadge } from "./badge";
import { useDebounce } from "../hooks/use_debounce";

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
  const update_stock = useDebounce(async (new_value) => {
    try {
      const res = await fetch(`/api/products/${product_id}/stock`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_stock: new_value }),
      });

      const data = await res.json();
      if (!data.success) console.error("Stock update Failed:", data.message);
    } catch (error) {
      console.error("Stock update", error);
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

export const StocksCard = ({ filter, columns, refresh }) => {
  const [products, setProducts] = useState([]);
  const [quantities, setQuantities] = useState({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState([]);

  useEffect(() => {
    const fetch_products = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        console.log("products:", data.products);
        setProducts(data.products);
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

  const sorted = sortProducts(products, filter);

  return (
    <div className="bg-white w-full h-full p-6 rounded-xl shadow-sm flex flex-col justify-between">
      <div className="overflow-x-auto">
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
                      <p className="font-medium text-gray-900 whitespace-nowrap">
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400">{product.brand}</p>
                    </td>

                    <td className="px-4 py-3">
                      <span className="font-mono text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
                        {product.barcode}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 text-indigo-600 font-medium whitespace-nowrap">
                        {product.category}
                      </span>
                    </td>

                    <td className="px-4 py-3">
                      <StockBadge
                        current={product.stock_management.current_stock}
                        reorder={product.stock_management.reorder_level}
                      />
                    </td>

                    <td className="px-4 py-3">
                      <QuantityControl
                        product_id={product._id}
                        value={
                          quantities[product._id] ??
                          product.stock_management.current_stock
                        }
                        onChange={(val) =>
                          setQuantities((prev) => ({
                            ...prev,
                            [product._id]: val,
                          }))
                        }
                      />
                    </td>

                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">
                      ₱ {product.pricing.selling_price.toFixed(2)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                          <Pencil size={15} />
                        </button>
                        <button className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
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

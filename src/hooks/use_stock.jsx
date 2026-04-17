import { useState, useCallback } from "react";

export const useStock = (initial_product) => {
  const [quantities, setQuantities] = useState(() => {
    const initial = {};
    initial_product.forEach((product) => {
      initial[product._id] = product.stock_management.current_stock;
    });

    return initial;
  });

  const updateQuantity = useCallback((id, value) => {
    setQuantities((prev) => ({ ...prev, [id]: value }));
  }, []);

  return { quantities, updateQuantity };
};

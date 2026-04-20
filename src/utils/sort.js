export const sortProducts = (products, filter) => {
  if (!filter || filter === "default") return products;
  return [...products].sort((a, b) => {
    switch (filter) {
      case "alphabetical":
        return a.name.localeCompare(b.name);
      case "qty_asc":
        return (
          a.stock_management.current_stock - b.stock_management.current_stock
        );
      case "qty_desc":
        return (
          b.stock_management.current_stock - a.stock_management.current_stock
        );
      case "price_asc":
        return a.pricing.selling_price - b.pricing.selling_price;
      case "price_desc":
        return b.pricing.selling_price - a.pricing.selling_price;
      default:
        return 0;
    }
  });
};

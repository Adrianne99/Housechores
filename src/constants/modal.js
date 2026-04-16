export const INITIAL_FORM = {
  barcode: "",
  name: "",
  brand: "",
  category: "",
  unit: "",
  stock_management: {
    current_stock: "",
    reorder_level: "",
    supplier: "",
  },
  pricing: {
    cost_per_unit: "",
    markup_value: "",
    selling_price: "",
  },
};

export const COLUMNS = [
  { key: "photo", label: "Photo" },
  { key: "name", label: "Product Name" },
  { key: "barcode", label: "Barcode" },
  { key: "category", label: "Category" },
  { key: "stock_level", label: "Stock Level" },
  { key: "unit", label: "Unit" },
  { key: "selling_price", label: "Selling Price" },
  { key: "actions", label: "Actions" },
];

export const UNITS = [
  "Pack",
  "Piece",
  "Bottle",
  "Can",
  "Pouch",
  "Box",
  "Sachet",
  "Kg",
  "Liter",
  "Roll",
];

export const CATEGORIES = [
  "Beverages",
  "Bread & Bakery",
  "Canned Goods",
  "Condiments & Sauces",
  "Dairy & Eggs",
  "Frozen Foods",
  "Instant Noodles",
  "Personal Care",
  "Rice & Grains",
  "Seasoning & Spices",
  "Snacks & Chips",
  "Cooking Oil",
  "Coffee & Tea",
  "Detergent & Cleaning",
];

export const useExportCSV = (products) => {
  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Brand",
      "Barcode",
      "Category",
      "Unit",
      "Current Stock",
      "Reorder Level",
      "Supplier",
      "Selling Price",
    ];

    const rows = products.map((p) => [
      p.name,
      p.brand,
      p.barcode,
      p.category,
      p.unit,
      p.stock_management.current_stock,
      p.stock_management.reorder_level,
      p.stock_management.supplier,
      p.pricing.selling_price,
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((v) => `"${v ?? ""}"`).join(","))
      .join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return { handleExportCSV };
};

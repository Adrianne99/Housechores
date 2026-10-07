import InventoryLayout from "../_shared/inventory_layout";

// ─── Admin / Owner Inventory ─────────────────────────────────
// Full powers. Sees branch breakdown when no specific branch is selected.
const AdminInventory = () => (
  <InventoryLayout
    permissions={{
      cards: [
        "inventory_value", // capital across all branches
        "total_products", // unique SKU count
        "low_stock_alerts", // total alerts across branches
        "branches", // how many branches in the system
      ],

      // Toolbar / actions
      can_add_product: true,
      can_delete: true,
      can_switch_branch: true,
      show_export: true,

      // Table row controls
      show_checkbox: true,
      show_actions: true,
      can_delete_row: true,

      // ⬇️ Only admin sees the grouped/expandable view
      show_branch_breakdown: true,

      // Column visibility
      show: { supplier: true, cost_price: true, selling_price: true },

      // Edit permissions per column
      edit: {
        name: true,
        barcode: true,
        category: true,
        stock: true,
        supplier: true,
        cost_price: true,
        selling_options: true, // pack sizes, sold by weight
      },
    }}
  />
);

export default AdminInventory;

import InventoryLayout from "../_shared/inventory_layout";

// ─── Branch Manager Inventory ────────────────────────────────
// Manages a single branch (backend auto-scopes). No branch breakdown —
// they only ever see their own data, so expandable rows make no sense.
const ManagerInventory = () => (
  <InventoryLayout
    permissions={{
      cards: [
        "inventory_value", // capital in their branch
        "total_stocks", // units on hand
        "low_stock", // below reorder level
        "out_of_stock", // losing sales now
      ],
      // Toolbar / actions
      can_add_product: true,
      can_delete: true,
      can_switch_branch: false,
      show_export: true,

      // Table row controls
      show_checkbox: true,
      show_actions: false,
      can_delete_row: false,

      // ⬇️ Manager only sees one branch — no expandable rows
      show_branch_breakdown: false,

      // Column visibility
      show: { supplier: true, cost_price: true, selling_price: true },

      // Edit permissions per column (same as admin)
      edit: {
        name: true,
        barcode: true,
        category: true,
        stock: true,
        supplier: true,
        cost_price: true,
      },
    }}
  />
);

export default ManagerInventory;

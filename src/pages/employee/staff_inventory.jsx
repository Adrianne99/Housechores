import InventoryLayout from "../_shared/inventory_layout";

// ─── Employee Inventory ──────────────────────────────────────
// Read-only view of their own branch. No branch breakdown,
// no cost/supplier info, no editing anywhere.
const StaffInventory = () => (
  <InventoryLayout
    permissions={{
      cards: [
        "items_on_floor", // total units in stock
        "low_stock", // restock from back
        "out_of_stock", // can't sell these
        "updated_today", // what changed recently
      ],

      // Toolbar / actions
      can_add_product: false,
      can_delete: false,
      can_switch_branch: false,
      show_export: false,

      // Table row controls
      show_checkbox: false,
      show_actions: false,
      can_delete_row: false,

      // ⬇️ Employee only sees one branch — no expandable rows
      show_branch_breakdown: false,

      // Column visibility — hide supplier + cost from employees
      show: { supplier: false, cost_price: false, selling_price: false },

      // No edit anywhere
      edit: {
        name: false,
        barcode: false,
        category: false,
        stock: false,
        supplier: false,
        cost_price: false,
      },
    }}
  />
);

export default StaffInventory;

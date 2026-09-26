import {
  LayoutDashboard,
  Box,
  Users,
  ShoppingCart,
  History,
  User,
  Clock,
  ReceiptText,
  AlertTriangle,
  Bell,
  ScrollText,
  Wallet,
  Truck,
  CalendarCheck,
  ClipboardList,
  Contact,
  CalendarDays,
  PiggyBank,
  ClipboardCheck,
  ArrowLeftRight,
  ArrowUpDown,
  BarChart3,
  Settings,
} from "lucide-react";

// Map role → clean URL prefix
export const ROLE_PREFIX = {
  admin: "/admin",
  branch_manager: "/branch_manager",
  employee: "/employee",
};

const ALL = ["admin", "branch_manager", "employee"];
const STAFF = ["branch_manager", "employee"]; // roles assigned to a branch

// Single menu definition shared by the desktop sidebar and mobile navbar.
// Only list pages that have a matching <Route> in App.jsx.
//   section: "sales" | "stock" | "work" | "workspace"
//   labels:  optional per-role label override
export const MENU_CONFIG = [
  { item: "Dashboard", link: "/dashboard", icon: LayoutDashboard, section: "sales", roles: ALL },
  { item: "POS Terminal", link: "/pos", icon: ShoppingCart, section: "sales", roles: ALL },
  { item: "Order History", link: "/history", icon: History, section: "sales", roles: ALL },
  {
    item: "Sales Report",
    labels: { employee: "My Sales" },
    link: "/sales-report",
    icon: ReceiptText,
    section: "sales",
    roles: ALL,
  },
  { item: "Profit Report", link: "/profit", icon: PiggyBank, section: "sales", roles: ["admin", "branch_manager"] },
  { item: "Purchasing Report", link: "/purchasing-report", icon: BarChart3, section: "sales", roles: ["admin", "branch_manager"] },
  { item: "Inventory", link: "/inventory", icon: Box, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Stock Alerts", link: "/stock-alerts", icon: AlertTriangle, section: "stock", roles: ALL },
  { item: "Purchase Orders", link: "/purchase-orders", icon: ClipboardList, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Receiving", link: "/receiving", icon: Truck, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Suppliers", link: "/suppliers", icon: Contact, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Stock Count", link: "/stock-count", icon: ClipboardCheck, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Transfers", link: "/transfers", icon: ArrowLeftRight, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Stock Movements", link: "/stock-movements", icon: ArrowUpDown, section: "stock", roles: ["admin", "branch_manager"] },
  {
    item: "Staff Management",
    link: "/staff-management",
    icon: Users,
    section: "work",
    roles: ["admin", "branch_manager"],
  },
  { item: "Schedule", link: "/schedule", icon: CalendarDays, section: "work", roles: ["admin", "branch_manager"] },
  { item: "Attendance", link: "/attendance", icon: CalendarCheck, section: "work", roles: ["admin", "branch_manager"] },
  { item: "Cash Drawer", link: "/cash-drawer", icon: Wallet, section: "work", roles: ALL },
  { item: "Time Clock", link: "/time-clock", icon: Clock, section: "work", roles: STAFF },
  { item: "Activity Log", link: "/activity", icon: ScrollText, section: "work", roles: ["admin"] },
  {
    item: "Notifications",
    link: "/notifications",
    icon: Bell,
    section: "workspace",
    roles: ALL,
    badge: "notifications",
  },
  { item: "Store Settings", link: "/settings", icon: Settings, section: "workspace", roles: ["admin"] },
  {
    item: "Profile",
    link: "/profile",
    icon: User,
    section: "workspace",
    roles: ALL,
    shared: true, // not role-prefixed
  },
];

export const MENU_SECTIONS = [
  { key: "sales", label: "Sales" },
  { key: "stock", label: "Stock" },
  { key: "work", label: "My Work", labels: { admin: "Team", branch_manager: "Team" } },
  { key: "workspace", label: "Account" },
];

// Menu items for a role, with role-prefixed links and role-specific labels.
export const menu_for_role = (role) => {
  const prefix = ROLE_PREFIX[role] || "/employee";
  return MENU_CONFIG.filter((item) => item.roles.includes(role)).map((item) => ({
    ...item,
    item: item.labels?.[role] ?? item.item,
    link: item.shared ? item.link : `${prefix}${item.link}`,
  }));
};

// Notification links are stored for one role (e.g. "/branch_manager/...");
// point them at the current user's own pages.
export const link_for_role = (link, role) => {
  if (!link) return link;
  const prefix = ROLE_PREFIX[role];
  return prefix ? link.replace(/^\/(admin|branch_manager|employee)(?=\/)/, prefix) : link;
};

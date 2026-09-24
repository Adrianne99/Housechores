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
  { item: "Inventory", link: "/inventory", icon: Box, section: "stock", roles: ["admin", "branch_manager"] },
  { item: "Stock Alerts", link: "/stock-alerts", icon: AlertTriangle, section: "stock", roles: STAFF },
  {
    item: "Staff Management",
    link: "/staff-management",
    icon: Users,
    section: "work",
    roles: ["admin", "branch_manager"],
  },
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

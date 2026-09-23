import {
  LayoutDashboard,
  Box,
  Users,
  ShoppingCart,
  History,
  User,
} from "lucide-react";

// Map role → clean URL prefix
export const ROLE_PREFIX = {
  admin: "/admin",
  branch_manager: "/branch_manager",
  employee: "/employee",
};

// Single menu definition shared by the desktop sidebar and mobile navbar.
// Only list pages that have a matching <Route> in App.jsx.
export const MENU_CONFIG = [
  {
    item: "Dashboard",
    link: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
    roles: ["admin", "branch_manager", "employee"],
  },
  {
    item: "POS Terminal",
    link: "/pos",
    icon: ShoppingCart,
    section: "main",
    roles: ["admin", "branch_manager", "employee"],
  },
  {
    item: "Inventory",
    link: "/inventory",
    icon: Box,
    section: "main",
    roles: ["admin", "branch_manager", "employee"],
  },
  {
    item: "Order History",
    link: "/history",
    icon: History,
    section: "main",
    roles: ["admin", "branch_manager", "employee"],
  },
  {
    item: "Staff Management",
    link: "/staff-management",
    icon: Users,
    section: "main",
    roles: ["admin", "branch_manager"],
  },
  {
    item: "Profile",
    link: "/profile",
    icon: User,
    section: "workspace",
    roles: ["admin", "branch_manager", "employee"],
    shared: true, // not role-prefixed
  },
];

// Menu items for a role, with role-prefixed links.
export const menu_for_role = (role) => {
  const prefix = ROLE_PREFIX[role] || "/employee";
  return MENU_CONFIG.filter((item) => item.roles.includes(role)).map(
    (item) => ({
      ...item,
      link: item.shared ? item.link : `${prefix}${item.link}`,
    }),
  );
};

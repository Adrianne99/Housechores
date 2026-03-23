import { Link, useLocation, useNavigate } from "react-router";
import { useContext, useState, useMemo } from "react";
import axios from "axios";
import { AppContext } from "@/context/app_context";
import logo from "@/assets/logo.png";
import { H6, Paragraph } from "./texts";
import Toast from "@/components/toast";
import {
  LayoutDashboard,
  Box,
  TrendingUp,
  Users,
  Settings,
  ShoppingCart,
  History,
  LogOut,
  User,
  Zap,
} from "lucide-react";
import { cn } from "@/utils/utils";
import Tooltip from "./tooltip";

// 1. Single Source of Truth for Menu Items
const MENU_CONFIG = [
  {
    item: "Dashboard",
    link: "",
    icon: LayoutDashboard,
    section: "main",
    roles: ["admin", "employee"],
  },
  {
    item: "POS Terminal",
    link: "/pos",
    icon: ShoppingCart,
    section: "main",
    roles: ["admin", "employee"],
  },
  {
    item: "Inventory",
    link: "/inventory",
    icon: Box,
    section: "main",
    roles: ["admin", "employee"],
  },
  {
    item: "AI Insights",
    link: "/ai-analytics",
    icon: Zap,
    section: "main",
    roles: ["admin"],
  },
  {
    item: "Messages",
    link: "/messages",
    icon: Zap,
    section: "main",
    roles: ["admin"],
  },
  {
    item: "Activities",
    link: "/activities",
    icon: Zap,
    section: "main",
    roles: ["admin"],
  },
  {
    item: "Sales Report",
    link: "/reports",
    icon: TrendingUp,
    section: "main",
    roles: ["admin"],
  },
  {
    item: "Order History",
    link: "/history",
    icon: History,
    section: "main",
    roles: ["admin", "employee"],
  },
  {
    item: "Staff Management",
    link: "/staff-management",
    icon: Users,
    section: "main",
    roles: ["admin"],
  },
  {
    item: "Profile",
    link: "/profile",
    icon: User,
    section: "workspace",
    roles: ["admin", "employee"],
  },
  {
    item: "Settings",
    link: "/settings",
    icon: Settings,
    section: "workspace",
    roles: ["admin"],
  },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { BACKEND_URL, setIsLoggedIn, setUserData, userData } =
    useContext(AppContext);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const role = userData?.role || "employee";
  const prefix = `/dashboard/${role}`;

  // 2. Optimized Filtering Logic
  const filteredItems = useMemo(() => {
    return MENU_CONFIG.filter((item) => item.roles.includes(role)).map(
      (item) => ({
        ...item,
        link: item.link === "/profile" ? "/profile" : `${prefix}${item.link}`,
      }),
    );
  }, [role, prefix]);

  const logout = async (e) => {
    if (e) e.preventDefault();
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/logout`);
      if (data.success) {
        setToast({ show: true, message: "Logging out...", type: "success" });
        setTimeout(() => {
          setIsLoggedIn(false);
          setUserData(null);
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch (error) {
      setToast({ show: true, message: "Logout failed", type: "error" });
    }
  };

  // Reusable Nav Component
  const NavItem = ({ item, link, icon: Icon, onClick }) => (
    <Link
      to={link}
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 px-4 py-2.5 my-1 rounded-xl transition-all duration-200 group justify-center lg:justify-start",
        pathname === link
          ? "bg-primary/10 text-primary shadow-sm"
          : "text-neutral-500 hover:bg-neutral-50",
      )}
    >
      <Tooltip text={item} position="right">
        <div className="flex items-center gap-3">
          <Icon
            size={20}
            className={cn(
              "shrink-0",
              pathname === link
                ? "text-primary"
                : "text-neutral-400 group-hover:text-neutral-600",
            )}
          />
          <Paragraph
            variant="small"
            className={cn(
              "mb-0 mt-0 hidden lg:block md:hidden",
              pathname === link
                ? "text-primary font-bold"
                : "text-neutral-600 font-medium",
            )}
          >
            {item}
          </Paragraph>
        </div>
      </Tooltip>
    </Link>
  );

  return (
    <aside className="w-full sm:w-64 md:w-20 lg:w-[280px] h-screen bg-white px-4 py-6 fixed flex flex-col transition-all duration-300">
      {toast.show && (
        <Toast {...toast} onClose={() => setToast({ ...toast, show: false })} />
      )}

      <div className="px-2 mb-10 flex justify-center lg:justify-start">
        <img src={logo} alt="Logo" className="w-32 lg:block hidden" />
        <div className="lg:hidden block size-10 bg-primary/10 rounded-lg" />
      </div>

      <nav className="flex-1">
        <H6 className="px-4 mb-2 text-primary hidden lg:block text-[10px] uppercase tracking-widest">
          Main Menu
        </H6>
        {filteredItems
          .filter((i) => i.section === "main")
          .map((item) => (
            <NavItem key={item.item} {...item} />
          ))}
      </nav>

      <div className="pt-4 border-t border-neutral-100">
        <H6 className="px-4 mb-2 text-primary hidden lg:block text-[10px] uppercase tracking-widest">
          Workspace
        </H6>
        {filteredItems
          .filter((i) => i.section === "workspace")
          .map((item) => (
            <NavItem key={item.item} {...item} />
          ))}
        <NavItem item="Logout" link="#" icon={LogOut} onClick={logout} />
      </div>
    </aside>
  );
};

export default Sidebar;

import React, { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import axios from "axios";
import {
  Menu,
  X,
  Bell,
  LayoutDashboard,
  PiggyBank,
  Scroll,
  NotebookText,
  Apple,
  BookOpen,
  User,
  Home,
  Info,
  Phone,
  Star,
} from "lucide-react";
import { AppContext } from "@/context/app_context";
import { H2, H5, H6 } from "./texts";
import { Button } from "./buttons";
import { cn } from "@/utils/utils";

const Navigation = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { userData, BACKEND_URL, setIsLoggedIn, setUserData } =
    useContext(AppContext);

  const isDashboardRoute =
    pathname.toLowerCase().startsWith("/dashboard") ||
    pathname.toLowerCase() === "/notification" ||
    pathname.toLowerCase() === "/todo-app" ||
    pathname.toLowerCase() === "/documentation" ||
    pathname.toLowerCase() === "/budget-planner" ||
    pathname.toLowerCase() === "/savings-tracker" ||
    pathname.toLowerCase() === "/calorie-counter";

  const logout = async () => {
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/logout`);
      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const nav_items = [
    { item: "Home", link: "/", icon: Home },
    { item: "About", link: "/about", icon: Info },
    { item: "Features", link: "/features", icon: Star },
    { item: "Contact Us", link: "/contact", icon: Phone },
  ];

  const nav_dashboard_items = [
    {
      item: "Dashboard",
      link: "/dashboard",
      icon: LayoutDashboard,
      category: "General",
    },
    {
      item: "Notification",
      link: "/notification",
      icon: Bell,
      category: "General",
    },
    {
      item: "Savings",
      link: "/savings-tracker",
      icon: PiggyBank,
      category: "Features",
    },
    { item: "Todo", link: "/todo-app", icon: Scroll, category: "Features" },
    {
      item: "Inventory",
      link: "/Inventory",
      icon: NotebookText,
      category: "Features",
    },
    {
      item: "Calorie",
      link: "/calorie-counter",
      icon: Apple,
      category: "Features",
    },
    {
      item: "Docs",
      link: "/documentation",
      icon: BookOpen,
      category: "Documentation",
    },
  ];

  const groupedItems = useMemo(() => {
    return nav_dashboard_items.reduce((acc, item) => {
      if (!acc[item.category]) acc[item.category] = [];
      acc[item.category].push(item);
      return acc;
    }, {});
  }, [nav_dashboard_items]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  const UserAvatar = () => (
    <Link to="/profile" className="relative group">
      <div
        className="size-9 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-sm overflow-hidden"
        style={{
          background:
            userData?.profileGradient ||
            "linear-gradient(to right, #6366f1, #a855f7)",
        }}
      >
        {userData?.name?.[0]?.toUpperCase()}
      </div>
    </Link>
  );

  // Reusable Link Component to avoid repetition
  const NavLink = ({ item }) => {
    const isActive = pathname === item.link;
    return (
      <Link
        to={item.link}
        onClick={() => setOpen(false)}
        className={cn(
          "flex items-center gap-4 p-3 rounded-2xl transition-all active:scale-[0.98]",
          isActive
            ? "bg-neutral-100 text-black"
            : "hover:bg-neutral-50 text-neutral-500",
        )}
      >
        {item.icon && (
          <item.icon
            size={20}
            className={isActive ? "text-black" : "text-neutral-500"}
          />
        )}
        <span
          className={cn(
            "font-semibold",
            isActive ? "text-black" : "text-neutral-600",
          )}
        >
          {item.item}
        </span>
      </Link>
    );
  };

  return (
    <nav className="relative z-50 w-full font-inter">
      {/* 🔹 DESKTOP NAVBAR */}
      <div className="hidden md:block w-full bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex justify-between items-center">
          <H2
            className="font-bold border-none pb-0 m-0 cursor-pointer"
            onClick={() => navigate("/")}
          >
            HC
          </H2>

          <div className="bg-neutral-100/50 px-6 py-4 rounded-full flex items-center gap-8">
            {(isDashboardRoute ? nav_dashboard_items : nav_items).map(
              (item) => (
                <Link key={item.item} to={item.link}>
                  <H5
                    className={cn(
                      "hover:text-black transition-colors m-0 normal-case font-semibold",
                      pathname === item.link
                        ? "text-black"
                        : "text-neutral-500",
                    )}
                  >
                    {item.item}
                  </H5>
                </Link>
              ),
            )}
          </div>

          <div className="flex items-center gap-4">
            {userData ? (
              <>
                <UserAvatar />
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </>
            ) : (
              <Button size="md" onClick={() => navigate("/login")}>
                Login
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 🔹 MOBILE NAVBAR */}
      <div className="md:hidden fixed top-0 w-full bg-white border-b border-neutral-100 px-4 py-3 flex justify-between items-center">
        <H5 className="font-bold m-0 uppercase tracking-tighter text-base!">
          Housechores
        </H5>
        <div className="flex items-center gap-3">
          {!userData && (
            <Button size="md" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
          {userData && <UserAvatar />}
          <button
            onClick={() => setOpen(!open)}
            className="p-1 text-neutral-800"
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* 🔹 MOBILE DRAWER MENU */}
      <div
        className={cn(
          "fixed inset-0 z-40 md:hidden transition-all duration-300",
          open ? "visible" : "invisible",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/80 transition-opacity",
            open ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setOpen(false)}
        />

        <div
          className={cn(
            "absolute bottom-0 w-full bg-white rounded-t-[2.5rem] p-6 max-h-[85vh] overflow-y-auto transition-transform duration-300 transform",
            open ? "translate-y-0" : "translate-y-full",
          )}
        >
          <div className="w-12 h-1.5 bg-neutral-200 rounded-full mx-auto mb-6" />

          <div className="space-y-6">
            {isDashboardRoute ? (
              Object.entries(groupedItems).map(([category, items]) => (
                <div key={category} className="space-y-2">
                  <H6 className="px-4 text-neutral-400 text-xs uppercase tracking-widest">
                    {category}
                  </H6>
                  <div className="grid grid-cols-1 gap-1">
                    {items.map((item) => (
                      <NavLink key={item.item} item={item} />
                    ))}
                  </div>
                </div>
              ))
            ) : (
              <div className="grid grid-cols-1 gap-1">
                <H6 className="px-4 text-neutral-400 text-xs uppercase tracking-widest mb-2">
                  Menu
                </H6>
                {nav_items.map((item) => (
                  <NavLink key={item.item} item={item} />
                ))}
              </div>
            )}

            {/* Logout Section */}
            {userData && (
              <div className="pt-4 border-t border-neutral-100">
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-4 p-4 text-red-500 font-semibold active:bg-red-50 rounded-2xl transition-colors"
                >
                  <X size={20} /> Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="h-14 md:hidden" />
    </nav>
  );
};

export default Navigation;

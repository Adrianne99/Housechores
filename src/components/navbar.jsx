import { useState, useEffect, useContext, useMemo } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import axios from "axios";
import { Menu, X, Home } from "lucide-react";
import { menu_for_role } from "@/constants/navigation";
import { AppContext } from "@/context/app_context";
import { H2, H5, H6 } from "./texts";
import { Button } from "./buttons";
import { cn } from "@/utils/utils";

const UserAvatar = ({ userData }) => (
  <Link to="/profile" className="relative group" aria-label="Profile">
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

const NavLink = ({ item, pathname, onNavigate }) => {
  const isActive = pathname === item.link;
  return (
    <Link
      to={item.link}
      onClick={onNavigate}
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

// `dashboard` = rendered inside the signed-in layout (shows the role menu).
const Navigation = ({ dashboard = false }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { userData, setIsLoggedIn, setUserData } =
    useContext(AppContext);

  const isDashboardRoute = dashboard && !!userData;

  const logout = async () => {
    try {
      const { data } = await axios.get(`/api/auth/logout`);
      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/", { replace: true });
      }
    } catch (error) {
      console.error(error.message);
    }
  };

  const nav_items = [{ item: "Home", link: "/", icon: Home }];

  const nav_dashboard_items = useMemo(
    () => menu_for_role(userData?.role),
    [userData?.role],
  );

  const groupedItems = useMemo(() => {
    return nav_dashboard_items.reduce((acc, item) => {
      const category = item.section === "workspace" ? "Workspace" : "Menu";
      if (!acc[category]) acc[category] = [];
      acc[category].push(item);
      return acc;
    }, {});
  }, [nav_dashboard_items]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <nav className="relative z-50 w-full font-inter">
      {/* 🔹 DESKTOP NAVBAR */}
      <div className="hidden md:block w-full bg-white/80 backdrop-blur-md border-b border-neutral-100">
        <div className="max-w-[1440px] mx-auto px-6 py-4 flex justify-between items-center">
          <H2
            className="font-bold border-none pb-0 m-0 cursor-pointer"
            onClick={() => navigate("/")}
          >
            Grocery POS
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
                <UserAvatar userData={userData} />
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
          Grocery POS
        </H5>
        <div className="flex items-center gap-3">
          {!userData && (
            <Button size="md" onClick={() => navigate("/login")}>
              Login
            </Button>
          )}
          {userData && <UserAvatar userData={userData} />}
          <button
            onClick={() => setOpen(!open)}
            className="p-1 text-neutral-800"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
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
                      <NavLink
                        key={item.item}
                        item={item}
                        pathname={pathname}
                        onNavigate={() => setOpen(false)}
                      />
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
                  <NavLink
                        key={item.item}
                        item={item}
                        pathname={pathname}
                        onNavigate={() => setOpen(false)}
                      />
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

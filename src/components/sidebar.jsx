import { Link, useLocation, useNavigate } from "react-router";
import { useContext, useState, useMemo } from "react";
import axios from "axios";
import { AppContext } from "@/context/app_context";
import logo from "@/assets/logo.png";
import { H6, Paragraph } from "./texts";
import Toast from "@/components/toast";
import { LogOut } from "lucide-react";
import { menu_for_role } from "@/constants/navigation";
import { cn } from "@/utils/utils";
import Tooltip from "./tooltip";

// Reusable Nav Component
const NavItem = ({ item, link, icon: Icon, onClick, pathname }) => (
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

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { setIsLoggedIn, setUserData, userData } =
    useContext(AppContext);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const role = userData?.role || "employee";
  const filteredItems = useMemo(() => menu_for_role(role), [role]);

  const logout = async (e) => {
    if (e) e.preventDefault();
    try {
      const { data } = await axios.get(`/api/auth/logout`);
      if (data.success) {
        setToast({ show: true, message: "Logging out...", type: "success" });
        setTimeout(() => {
          setIsLoggedIn(false);
          setUserData(null);
          navigate("/", { replace: true });
        }, 1200);
      }
    } catch {
      setToast({ show: true, message: "Logout failed", type: "error" });
    }
  };

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
            <NavItem key={item.item} {...item} pathname={pathname} />
          ))}
      </nav>

      <div className="pt-4 border-t border-neutral-100">
        <H6 className="px-4 mb-2 text-primary hidden lg:block text-[10px] uppercase tracking-widest">
          Workspace
        </H6>
        {filteredItems
          .filter((i) => i.section === "workspace")
          .map((item) => (
            <NavItem key={item.item} {...item} pathname={pathname} />
          ))}
        <NavItem
          item="Logout"
          link="#"
          icon={LogOut}
          onClick={logout}
          pathname={pathname}
        />
      </div>
    </aside>
  );
};

export default Sidebar;

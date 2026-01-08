import { Link, useLocation, useNavigate } from "react-router";
import { useContext, useState } from "react";
import axios from "axios";
import { AppContext } from "@/context/app_context";
import logo from "@/assets/logo.png";
import { H6, Paragraph } from "./texts";
import Toast from "@/components/toast";
import {
  LayoutDashboard,
  Scroll,
  PiggyBank,
  Apple,
  BookOpen,
  User,
  LogOut,
  NotebookText,
} from "lucide-react";
import { cn } from "@/utils/utils";
import Tooltip from "./tooltip";

const sidebar_items = [
  {
    item: "Dashboard",
    link: "/dashboard",
    icon: LayoutDashboard,
    section: "main",
  },
  {
    item: "Savings Tracker",
    link: "/savings-tracker",
    icon: PiggyBank,
    section: "main",
  },
  { item: "Todo App", link: "/todo-app", icon: Scroll, section: "main" },
  {
    item: "Budget Planner",
    link: "/budget-planner",
    icon: NotebookText,
    section: "main",
  },
  {
    item: "Calorie Counter",
    link: "/calorie-counter",
    icon: Apple,
    section: "main",
  },
  {
    item: "Documentation",
    link: "/documentation",
    icon: BookOpen,
    section: "main",
  },
  { item: "Profile", link: "/profile", icon: User, section: "workspace" },
  { item: "Logout", link: "#", icon: LogOut, section: "workspace" },
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { BACKEND_URL, setIsLoggedIn, setUserData } = useContext(AppContext);
  const [toast, setToast] = useState({
    show: false,
    message: "",
    type: "success",
  });

  const sidebarClass = (link) =>
    cn(
      "flex items-center justify-center lg:justify-start px-4 py-2.5 my-1 rounded-xl transition-all duration-200 group",
      pathname === link
        ? "bg-primary/10 text-primary shadow-sm shadow-primary/5"
        : "text-neutral-500 hover:bg-neutral-50"
    );

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

  const SidebarItem = ({ item, link, icon: Icon, onClick }) => {
    const isMobileOrLarge = "block md:hidden lg:block"; // CSS logic for text visibility

    return (
      <Link to={link} className={sidebarClass(link)} onClick={onClick}>
        {/* 1. We wrap the content inside the Tooltip.
         2. We use a 'disabled' prop logic or simply only trigger on md screens.
      */}
        <Tooltip text={item} position="right">
          <div className="flex items-center gap-3">
            <Icon
              size={20}
              className={cn(
                "transition-colors shrink-0",
                pathname === link
                  ? "text-primary"
                  : "text-neutral-400 group-hover:text-neutral-600"
              )}
            />

            <Paragraph
              variant="small"
              className={cn(
                "transition-all mb-0 mt-0",
                isMobileOrLarge, // Uses the responsive visibility
                pathname === link
                  ? "text-primary font-bold"
                  : "text-neutral-600 font-medium"
              )}
            >
              {item}
            </Paragraph>
          </div>
        </Tooltip>
      </Link>
    );
  };

  return (
    <aside className="w-full sm:w-64 md:w-20 lg:w-[280px] h-screen bg-white px-4 py-6 fixed flex flex-col transition-all duration-300">
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast({ ...toast, show: false })}
        />
      )}

      {/* Logo: Icon only on md, full logo on others */}
      <div className="px-2 mb-10 flex justify-center lg:justify-start">
        <img src={logo} alt="Logo" className="w-32  block" />
        <div className="hidden md:block lg:hidden size-10 bg-primary/10 rounded-lg" />
      </div>

      <nav className="flex-1 space-y-1">
        <H6 className="px-4 mb-4 text-primary md:hidden lg:block block text-[10px] uppercase tracking-widest">
          Main Menu
        </H6>
        {sidebar_items
          .filter((i) => i.section === "main")
          .map((props) => (
            <SidebarItem key={props.item} {...props} />
          ))}
      </nav>

      <div className="pt-6 border-t border-neutral-100">
        <H6 className="px-4 mb-4 text-primary md:hidden lg:block block text-[10px] uppercase tracking-widest">
          Workspace
        </H6>
        <div className="space-y-1">
          {sidebar_items
            .filter((i) => i.section === "workspace" && i.item !== "Logout")
            .map((props) => (
              <SidebarItem key={props.item} {...props} />
            ))}
          <SidebarItem item="Logout" link="#" icon={LogOut} onClick={logout} />
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;

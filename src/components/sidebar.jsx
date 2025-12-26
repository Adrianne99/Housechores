import { Link, useLocation, useNavigate } from "react-router";
import { useContext } from "react";
import axios from "axios";
import { AppContext } from "../context/app_context";
import logo from "../assets/logo.png";
import { H6 } from "./texts";
import {
  LayoutDashboard,
  Scroll,
  PiggyBank,
  Apple,
  BookOpen,
  User,
  ArrowLeftToLine,
  NotebookText,
} from "lucide-react";
import { cn } from "../utils/utils";

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
  {
    item: "Todo App",
    link: "/todo-app",
    icon: Scroll,
    section: "main",
  },
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
  {
    item: "Profile",
    link: "/profile",
    icon: User,
    section: "workspace",
  },
  { item: "Logout", link: "#", icon: ArrowLeftToLine, section: "workspace" }, // Changed link to # for logout
];

const Sidebar = () => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { BACKEND_URL, setIsLoggedIn, setUserData } = useContext(AppContext);

  const sidebarClass = (link) =>
    cn(
      "flex items-center px-3 py-1 rounded-lg transition-all cursor-pointer",
      pathname === link
        ? "bg-linear-to-r from-primary/30 via-second-gradient/20 to-third-gradient/20 text-primary"
        : "text-neutral-600 hover:bg-neutral-100"
    );

  const logout = async (e) => {
    // Prevent navigation since we are handling redirection manually
    if (e) e.preventDefault();
    try {
      axios.defaults.withCredentials = true;
      const { data } = await axios.get(`${BACKEND_URL}/api/auth/logout`);

      if (data.success) {
        setIsLoggedIn(false);
        setUserData(null);
        navigate("/", { replace: true });
      }
      console.log("Logged out successfully");
    } catch (error) {
      console.log(error.message);
    }
  };

  // Added onClick to destructured props
  const SidebarItem = ({ item, link, icon: Icon, onClick }) => (
    <Link to={link} className={sidebarClass(link)} onClick={onClick}>
      <div className="flex items-center gap-1 px-2 py-1.5">
        <Icon size={20} strokeWidth={2} />
        <H6
          className={cn(
            pathname === link
              ? "text-primary font-semibold!"
              : "text-neutral-500"
          )}
        >
          {item}
        </H6>
      </div>
    </Link>
  );

  return (
    <div className="w-[280px] h-screen bg-white px-6 shadow-xs fixed ">
      <div className="border-b border-neutral-200 py-3 mb-4">
        <img src={logo} alt="Housechores Logo" className="w-32 mx-auto" />
      </div>

      {/* Main Section */}
      <div className="flex flex-col gap-2 border-b border-neutral-200 py-2 mb-6">
        {sidebar_items
          .filter((i) => i.section === "main")
          .map((props) => (
            <SidebarItem key={props.item} {...props} />
          ))}
      </div>

      {/* Workspace Section */}
      <div className="space-y-2">
        <H6 className="text-primary font-semibold uppercase text-xs tracking-wider">
          workspace
        </H6>

        {sidebar_items
          .filter((i) => i.section === "workspace" && i.item !== "Logout")
          .map((props) => (
            <SidebarItem key={props.item} {...props} />
          ))}

        {/* Manual Logout Item with logic attached */}
        <SidebarItem
          item="Logout"
          link="#"
          icon={ArrowLeftToLine}
          onClick={logout}
        />
      </div>
    </div>
  );
};

export default Sidebar;

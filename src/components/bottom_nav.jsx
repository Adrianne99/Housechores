import React, { useState, useEffect, useContext } from "react";
import {
  LayoutDashboard,
  Scroll,
  PiggyBank,
  Apple,
  BookOpen,
  User,
  Bell,
  Menu,
  ListPlus,
  NotebookText,
  X,
} from "lucide-react";
import { H1, H2, H3, H4, H5, H6, Paragraph } from "./texts"; // Using unified text components
import { Link, useLocation } from "react-router";
import { cn } from "@/utils/utils";
import { AppContext } from "@/context/app_context";

const BottomNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);
  const { userData } = useContext(AppContext);

  const sidebar_items = [
    {
      item: "Dashboard",
      link: "/dashboard",
      icon: LayoutDashboard,
      section: "workspace",
    },
    {
      item: "Savings Tracker",
      link: "/savings-tracker",
      icon: PiggyBank,
      section: "main",
    },
    { item: "Todo App", link: "/todo-app", icon: Scroll, section: "main" },
    {
      item: "Inventory",
      link: "/inventory",
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
  ];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <div className="relative z-50 font-inter">
      {/* 🔹 OVERLAY */}
      {open && (
        <div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm z-40 transition-opacity"
          onClick={() => setOpen(false)}
        />
      )}

      {/* 🔹 ACTION MENU (DRAWER) */}
      <div
        className={cn(
          "fixed z-50 w-full transition-all duration-200 linear",
          open
            ? "top-14 translate-y-0 opacity-100"
            : "-top-14 translate-y-10 opacity-0 pointer-events-none",
        )}
      >
        <div className="bg-white shadow-2xl border border-neutral-100 p-1.5 overflow-hidden">
          <div className="flex flex-col">
            {sidebar_items
              .filter((i) => i.section === "main" || i.item === "Dashboard")
              .map((item) => (
                <Link
                  key={item.item}
                  to={item.link}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-6 py-4 rounded-xl transition-colors",
                    pathname === item.link
                      ? "bg-primary/5"
                      : "active:bg-neutral-50",
                  )}
                >
                  <item.icon
                    size={19}
                    className={
                      pathname === item.link
                        ? "text-primary"
                        : "text-neutral-400"
                    }
                  />
                  <Paragraph
                    variant="small"
                    className={cn(
                      "m-0 font-bold",
                      pathname === item.link
                        ? "text-primary"
                        : "text-neutral-600",
                    )}
                  >
                    {item.item}
                  </Paragraph>
                </Link>
              ))}
          </div>
        </div>
      </div>

      <div className="sticky top-0 w-full bg-white border-b border-neutral-100 z-50 px-4 py-3">
        <div className="flex justify-between items-center relative">
          <H5 className="tracking-widest font-bold border-none">HOUSECHORES</H5>

          <div className="flex items-center gap-1">
            {sidebar_items
              .filter((i) => i.item === "Profile")
              .map((item) => (
                <Link
                  to={item.link}
                  key={item.item}
                  className="flex items-center"
                >
                  <div className="size-9 flex justify-center items-center rounded-full overflow-hidden border border-neutral-100">
                    {userData?.name?.[0]?.toUpperCase()}
                  </div>
                </Link>
              ))}

            {/* Hamburger Menu Toggle */}
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="p-1 text-neutral-800 transition-transform active:scale-95"
            >
              {open ? <X size={26} /> : <Menu size={26} strokeWidth={1.5} />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;

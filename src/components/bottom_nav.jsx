import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  Scroll,
  PiggyBank,
  Apple,
  BookOpen,
  User,
  ListPlus,
  NotebookText,
  X,
} from "lucide-react";
import { H6, Paragraph } from "./texts"; // Using unified text components
import { Link, useLocation } from "react-router";
import { cn } from "@/utils/utils";

const BottomNav = () => {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

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
          "fixed z-50 w-full px-6 transition-all duration-300 ease-out",
          open
            ? "bottom-24 translate-y-0 opacity-100"
            : "bottom-0 translate-y-10 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-white rounded-[24px] shadow-2xl border border-neutral-100 p-2 overflow-hidden">
          <div className="flex flex-col">
            {sidebar_items
              .filter((i) => i.section === "main")
              .map((item) => (
                <Link
                  key={item.item}
                  to={item.link}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center gap-4 px-6 py-4 rounded-xl transition-colors",
                    pathname === item.link
                      ? "bg-primary/5"
                      : "active:bg-neutral-50"
                  )}
                >
                  <item.icon
                    size={20}
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
                        : "text-neutral-600"
                    )}
                  >
                    {item.item}
                  </Paragraph>
                </Link>
              ))}
          </div>
        </div>
      </div>

      {/* 🔹 BOTTOM BAR */}
      <div className="fixed bottom-6 w-[90%] left-1/2 -translate-x-1/2 bg-white rounded-full shadow-lg border border-neutral-100 z-50 px-2 py-2">
        <div className="flex justify-around items-center relative">
          {/* Dashboard Link */}
          {sidebar_items
            .filter((i) => i.item === "Dashboard")
            .map((item) => (
              <Link
                to={item.link}
                key={item.item}
                className="flex flex-col items-center gap-1 px-4 py-1"
              >
                <item.icon
                  size={20}
                  className={
                    pathname === item.link ? "text-primary" : "text-neutral-400"
                  }
                />
                <H6
                  className={cn(
                    "text-[10px] m-0",
                    pathname === item.link ? "text-primary" : "text-neutral-400"
                  )}
                >
                  {item.item}
                </H6>
              </Link>
            ))}

          {/* 🔹 CENTER TOGGLE BUTTON */}
          <div className="relative -top-1">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className={cn(
                "p-4 rounded-full text-white shadow-lg transition-transform active:scale-90",
                "bg-primary" // Using your primary brand color
              )}
            >
              {open ? <X size={20} /> : <ListPlus size={20} />}
            </button>
          </div>

          {/* Profile Link */}
          {sidebar_items
            .filter((i) => i.item === "Profile")
            .map((item) => (
              <Link
                to={item.link}
                key={item.item}
                className="flex flex-col items-center gap-1 px-4 py-1"
              >
                <item.icon
                  size={20}
                  className={
                    pathname === item.link ? "text-primary" : "text-neutral-400"
                  }
                />
                <H6
                  className={cn(
                    "text-[10px] m-0",
                    pathname === item.link ? "text-primary" : "text-neutral-400"
                  )}
                >
                  {item.item}
                </H6>
              </Link>
            ))}
        </div>
      </div>
    </div>
  );
};

export default BottomNav;

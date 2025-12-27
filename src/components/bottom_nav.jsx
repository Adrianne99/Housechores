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
} from "lucide-react";
import { H6 } from "./texts";
import { Link } from "react-router";

const BottomNav = () => {
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

  const [open, setOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "auto";
  }, [open]);

  return (
    <div className="relative z-50">
      {open && (
        <div
          className="fixed inset-0 bg-black/30 z-40"
          onClick={() => setOpen(false)}
        />
      )}
      <div
        className={`fixed z-50 w-full h-fit  transition-transform duration-300 ${
          open ? "translate-y-0 bottom-28" : "translate-y-full bottom-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-2">
          {sidebar_items
            .filter((i) => i.section === "main")
            .map((item) => (
              <Link
                key={item.item}
                to={item.link}
                onClick={() => setOpen(false)}
              >
                <div className="border-b border-neutral-300 py-3 w-4/5 mx-auto bg-white text-center rounded-xl my-2">
                  <H6 className="text-neutral-600 hover:text-neutral-950">
                    {item.item}
                  </H6>
                </div>
              </Link>
            ))}
        </div>
      </div>

      {/* 🔹 BOTTOM BAR */}
      <div className="bg-white fixed bottom-4 w-4/5 left-1/2 -translate-x-1/2 rounded-xl shadow-xs z-50">
        <div className="flex justify-between items-center p-3 relative">
          {sidebar_items
            .filter((i) => i.section === "workspace")
            .map((item) => (
              <div className="space-y-1 text-center" key={item.item}>
                <Link to={item.link}>
                  <item.icon size={20} className="mx-auto" />
                  <H6>{item.item}</H6>
                </Link>
              </div>
            ))}

          {/* 🔹 CENTER BUTTON */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <button
              onClick={() => setOpen((prev) => !prev)}
              className="bg-linear-to-r from-primary via-second-gradient to-third-gradient p-4 rounded-full text-white shadow-lg"
            >
              <ListPlus size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;

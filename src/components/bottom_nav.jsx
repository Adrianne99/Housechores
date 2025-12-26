import React from "react";
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
      section: "workspace",
    },
    { item: "", link: "#", icon: ListPlus, section: "workspace" },

    {
      item: "Settings",
      link: "/settings",
      icon: BookOpen,
      section: "workspace",
    },
    {
      item: "Profile",
      link: "/profile",
      icon: User,
      section: "workspace",
    },
  ];

  return (
    <div className="bg-white fixed bottom-4 w-3/4 left-1/2 -translate-x-1/2 rounded-xl shadow-xs">
      <div className="flex justify-between items-center p-4 flex-1">
        {sidebar_items
          .filter((idx) => idx.section === "workspace")
          .map((index) => (
            <div
              className="flex flex-col justify-between items-center flex-1"
              key={index.item}
            >
              <index.icon size={20} strokeWidth={2} />
              <H6>{index.item}</H6>
            </div>
          ))}
      </div>
    </div>
  );
};

export default BottomNav;

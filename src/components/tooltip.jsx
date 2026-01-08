import React, { useState } from "react";
import { cn } from "@/utils/utils";

const Tooltip = ({ children, text, position = "right" }) => {
  const [show, setShow] = useState(false);

  const positionClasses = {
    // Optimized for the 20-wide (80px) md sidebar
    right: "left-9 top-1/2 -translate-y-1/2 ml-2",
    top: "bottom-full left-1/2 -translate-x-1/2 mb-3",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-3",
  };

  return (
    <div
      className="relative flex items-center"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}

      {/* LITERAL MATCH LOGIC: 
          hidden: Hidden on mobile (sm)
          md:block: Shown on tablet/small laptop (md)
          lg:hidden: Hidden again on desktop (lg)
      */}
      {show && (
        <div
          className={cn(
            "absolute z-9999 whitespace-nowrap px-3 py-1.5 pointer-events-none",
            "hidden md:block lg:hidden",
            "bg-[#F3F3FF] text-gray-600 text-[11px] border border-gray-200 font-bold rounded-lg shadow-xl",
            "animate-in fade-in zoom-in-95 duration-200",
            positionClasses[position]
          )}
        >
          {text}
          {/* Tooltip Arrow */}
          <div
            className={cn(
              "absolute size-2 bg-[#F3F3FF] border-l border-b border-gray-200 rotate-45",
              position === "right" && "-left-1 top-1/2 -translate-y-1/2",
              position === "top" && "-bottom-1 left-1/2 -translate-x-1/2"
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;

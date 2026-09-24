
import { CheckCircle, XCircle, AlertCircle, X } from "lucide-react";
import { cn } from "@/utils/utils";

const Toast = ({ message, type = "success", onClose, duration = 3000 }) => {
  const themes = {
    success: {
      container: "border-green-100 bg-green-50 text-green-800",
      icon: <CheckCircle className="text-green-500" size={20} />,
      bar: "bg-green-500",
    },
    error: {
      container: "border-red-100 bg-red-50 text-red-800",
      icon: <XCircle className="text-red-500" size={20} />,
      bar: "bg-red-500",
    },
    warning: {
      container: "border-amber-100 bg-amber-50 text-amber-800",
      icon: <AlertCircle className="text-amber-500" size={20} />,
      bar: "bg-amber-500",
    },
  };

  return (
    <div
      className={cn(
        "fixed md:top-5 md:right-5 z-100 flex flex-col min-w-[300px] rounded-lg border shadow-lg overflow-hidden animate-in fade-in slide-in-from-right-5",
        themes[type].container,
      )}
    >
      <div className="flex items-center gap-3 p-4">
        {themes[type].icon}
        <p className="text-sm font-semibold flex-1">{message}</p>
        <button
          onClick={onClose}
          className="hover:opacity-70 transition-opacity"
        >
          <X size={16} />
        </button>
      </div>

      {/* Timer Progress Bar */}
      <div className="h-1 w-full bg-black/5">
        {/* The bar shrinks with a CSS animation; when it ends the toast
            closes (no timers or effects). */}
        <div
          className={cn("h-full origin-left", themes[type].bar)}
          style={{ animation: `toast-progress ${duration}ms linear forwards` }}
          onAnimationEnd={onClose}
        />
      </div>
    </div>
  );
};

export default Toast;

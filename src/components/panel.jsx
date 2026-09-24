import { H6 } from "./texts";
import { cn } from "../utils/utils";

// White card with a small uppercase title and optional right-side action.
export const Panel = ({ title, action, children, className }) => (
  <section
    className={cn(
      "bg-white w-full p-5 rounded-xl shadow-sm border border-gray-100",
      className,
    )}
  >
    {(title || action) && (
      <div className="flex items-center justify-between gap-3 mb-4">
        {title && (
          <H6 className="text-gray-500 font-medium uppercase tracking-wider">{title}</H6>
        )}
        {action}
      </div>
    )}
    {children}
  </section>
);

export const EmptyState = ({ children }) => (
  <p className="text-xs text-gray-400 italic py-6 text-center">{children}</p>
);

export const Skeleton = ({ rows = 3, className = "h-10" }) => (
  <div className="space-y-3">
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className={cn("bg-gray-100 rounded animate-pulse", className)} />
    ))}
  </div>
);

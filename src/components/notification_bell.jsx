import { useContext, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  CheckCheck,
  PackageX,
  PackageSearch,
  ReceiptText,
  Undo2,
  Info,
  CalendarDays,
} from "lucide-react";
import { useNotifications } from "../context/notification_context";
import { AppContext } from "../context/app_context";
import { ROLE_PREFIX, link_for_role } from "../constants/navigation";
import { time_ago } from "../utils/format";
import { cn } from "../utils/utils";

const NOTIFICATION_STYLES = {
  sale: { icon: ReceiptText, tone: "bg-green-50 text-green-600" },
  void: { icon: Undo2, tone: "bg-red-50 text-red-600" },
  low_stock: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  out_of_stock: { icon: PackageX, tone: "bg-red-50 text-red-600" },
  restock_request: { icon: PackageSearch, tone: "bg-indigo-50 text-indigo-600" },
  purchase: { icon: PackageSearch, tone: "bg-amber-50 text-amber-600" },
  delivery: { icon: PackageSearch, tone: "bg-green-50 text-green-600" },
  refund: { icon: Undo2, tone: "bg-orange-50 text-orange-600" },
  discount: { icon: ReceiptText, tone: "bg-green-50 text-green-600" },
  drawer: { icon: AlertTriangle, tone: "bg-amber-50 text-amber-600" },
  schedule: { icon: CalendarDays, tone: "bg-indigo-50 text-indigo-600" },
  system: { icon: Info, tone: "bg-gray-100 text-gray-600" },
};

export const NotificationItem = ({ n, onOpen, compact = false }) => {
  const style = NOTIFICATION_STYLES[n.type] ?? NOTIFICATION_STYLES.system;
  const Icon = style.icon;
  return (
    <button
      type="button"
      onClick={() => onOpen(n)}
      className={cn(
        "w-full flex items-start gap-3 text-left rounded-xl transition-colors hover:bg-gray-50",
        compact ? "p-2.5" : "p-3",
        !n.read_at && "bg-indigo-50/40",
      )}
    >
      <span className={cn("shrink-0 p-2 rounded-lg", style.tone)}>
        <Icon size={16} />
      </span>
      <span className="flex-1 min-w-0">
        <span className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{n.title}</span>
          <span className="text-[11px] text-gray-400 shrink-0">{time_ago(n.createdAt)}</span>
        </span>
        {n.message && (
          <span className="block text-xs text-gray-500 mt-0.5 line-clamp-2">{n.message}</span>
        )}
      </span>
      {!n.read_at && (
        <span className="mt-1.5 size-2 rounded-full bg-indigo-500 shrink-0" aria-label="Unread" />
      )}
    </button>
  );
};

export const NotificationBell = () => {
  const ctx = useNotifications();
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);


  if (!ctx) return null;
  const { notifications, unread, markRead, markAllRead } = ctx;
  const prefix = ROLE_PREFIX[userData?.role] ?? "/employee";

  const open_item = (n) => {
    markRead(n._id);
    setOpen(false);
    if (n.link) navigate(link_for_role(n.link, userData?.role));
  };

  return (
    <div className="relative" ref={ref} onKeyDown={(e) => e.key === "Escape" && setOpen(false)}>
      {open && (
        // Transparent layer: clicking anywhere else closes the dropdown.
        <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
      )}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={unread ? `Notifications, ${unread} unread` : "Notifications"}
        aria-expanded={open}
        className="relative bg-white shadow-sm size-10 flex items-center justify-center rounded-xl hover:bg-indigo-50 transition-colors"
      >
        <Bell size={20} color="#4239C4" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center">
            {unread > 99 ? "99+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 w-[min(22rem,calc(100vw-2rem))] bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">
              Notifications {unread > 0 && <span className="text-indigo-600">({unread})</span>}
            </p>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAllRead}
                className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1"
              >
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto p-2 space-y-1">
            {notifications.length === 0 ? (
              <p className="text-xs text-gray-400 italic text-center py-8">
                You're all caught up.
              </p>
            ) : (
              notifications
                .slice(0, 8)
                .map((n) => <NotificationItem key={n._id} n={n} onOpen={open_item} compact />)
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setOpen(false);
              navigate(`${prefix}/notifications`);
            }}
            className="w-full text-center text-xs font-semibold text-indigo-600 py-3 border-t border-gray-100 hover:bg-gray-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};

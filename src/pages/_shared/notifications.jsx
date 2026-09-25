import { useContext, useState } from "react";
import { AppContext } from "../../context/app_context";
import { useNavigate } from "react-router";
import { CheckCheck } from "lucide-react";
import Header from "../../components/header";
import { Panel, EmptyState, Skeleton } from "../../components/panel";
import { NotificationItem } from "../../components/notification_bell";
import { link_for_role } from "../../constants/navigation";
import { useNotifications } from "../../context/notification_context";
import { cn } from "../../utils/utils";

const TABS = [
  { key: "all", label: "All" },
  { key: "unread", label: "Unread" },
  { key: "sales", label: "Sales", types: ["sale", "void", "refund", "discount", "drawer"] },
  { key: "stock", label: "Stock", types: ["low_stock", "out_of_stock", "restock_request", "purchase", "delivery", "transfer", "expiry"] },
  { key: "schedule", label: "Schedule", types: ["schedule"] },
];

export default function NotificationsPage() {
  const ctx = useNotifications();
  const { userData } = useContext(AppContext);
  const navigate = useNavigate();
  const [tab, setTab] = useState("all");

  if (!ctx) return null;
  const { notifications, unread, loading, markRead, markAllRead } = ctx;
  const t = TABS.find((x) => x.key === tab);
  const shown = notifications.filter((n) =>
    tab === "unread" ? !n.read_at : t.types ? t.types.includes(n.type) : true,
  );

  return (
    <div className="relative w-full space-y-6 pt-3 pb-12">
      <Header title="Notifications" subtitle={unread ? `${unread} unread` : "You're all caught up."} />

      <Panel
        action={
          unread > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-indigo-600 hover:underline flex items-center gap-1">
              <CheckCheck size={14} /> Mark all read
            </button>
          )
        }
        title="Latest 30"
      >
        <div className="flex flex-wrap gap-2 mb-4">
          {TABS.map((x) => (
            <button
              key={x.key}
              type="button"
              onClick={() => setTab(x.key)}
              className={cn(
                "px-3 py-1.5 text-xs font-semibold rounded-full border",
                tab === x.key ? "bg-indigo-600 text-white border-indigo-600" : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50",
              )}
            >
              {x.label}
            </button>
          ))}
        </div>

        {loading ? (
          <Skeleton rows={5} className="h-14" />
        ) : shown.length === 0 ? (
          <EmptyState>Nothing here.</EmptyState>
        ) : (
          <div className="space-y-1">
            {shown.map((n) => (
              <NotificationItem
                key={n._id}
                n={n}
                onOpen={(x) => {
                  markRead(x._id);
                  if (x.link) navigate(link_for_role(x.link, userData?.role));
                }}
              />
            ))}
          </div>
        )}
        <p className="text-[11px] text-gray-400 mt-4">Notifications are kept for 30 days.</p>
      </Panel>
    </div>
  );
}

"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  Receipt,
  ChefHat,
  CreditCard,
  Trash2,
  CheckCheck,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNotificationStore, WaiterNotification } from "@/stores/useNotificationStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { useDineInStore } from "@/stores/useDineInStore";
import { cn } from "@/lib/utils";

export default function WaiterNotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAll, getUnreadCount } = useNotificationStore();
  const { sessions } = useDineInStore();

  const [filterType, setFilterType] = React.useState<string>("all");
  const [selectedTableModal, setSelectedTableModal] = React.useState<{ id: string; number: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = mounted ? getUnreadCount() : 0;

  const filtered = notifications.filter((n) => {
    if (filterType === "unread") return !n.read;
    if (filterType === "kot") return n.type === "kot_ready" || n.type === "kot_preparing";
    if (filterType === "bill") return n.type === "bill_ready" || n.type === "bill_requested" || n.type === "payment_completed";
    return true;
  });

  const getIcon = (type: WaiterNotification["type"]) => {
    switch (type) {
      case "kot_ready":
        return <ChefHat className="h-5 w-5 text-teal-600" />;
      case "bill_ready":
        return <Receipt className="h-5 w-5 text-purple-600" />;
      case "bill_requested":
        return <Bell className="h-5 w-5 text-amber-600" />;
      case "payment_completed":
        return <CreditCard className="h-5 w-5 text-emerald-600" />;
      default:
        return <CheckCircle2 className="h-5 w-5 text-brand-600" />;
    }
  };

  const handleOpenTable = (notif: WaiterNotification) => {
    markAsRead(notif.id);
    if (notif.tableNumber) {
      const matched = Object.values(sessions).find((s) => s.tableNumber === notif.tableNumber);
      if (matched) {
        setSelectedTableModal({ id: matched.tableId, number: matched.tableNumber });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-brand-600" />
              Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" className="font-bold text-xs">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Realtime updates on kitchen preparation, ready food, and bill settlements
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead} className="space-x-1">
              <CheckCheck className="h-3.5 w-3.5" />
              <span>Mark All Read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button variant="secondary" size="sm" onClick={clearAll} className="space-x-1 text-slate-500 hover:text-rose-600">
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear</span>
            </Button>
          )}
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1">
        {[
          { id: "all", label: "All Alerts" },
          { id: "unread", label: `Unread (${unreadCount})` },
          { id: "kot", label: "Kitchen & KOT" },
          { id: "bill", label: "Bills & Payment" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shrink-0",
              filterType === tab.id
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs dark:border-slate-800 dark:bg-slate-900 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm font-semibold">No notifications</p>
            <p className="text-xs mt-1">You are all caught up!</p>
          </div>
        ) : (
          filtered.map((n) => (
            <div
              key={n.id}
              onClick={() => handleOpenTable(n)}
              className={cn(
                "p-4 flex items-start justify-between cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/40",
                !n.read && "bg-brand-50/20 dark:bg-brand-950/10"
              )}
            >
              <div className="flex items-start space-x-3 min-w-0 flex-1 mr-4">
                <div className="mt-0.5 p-2 rounded-xl bg-slate-100 dark:bg-slate-800 shrink-0">
                  {getIcon(n.type)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center space-x-2">
                    <p className={cn("text-xs font-bold text-slate-900 dark:text-slate-100 truncate", !n.read && "text-brand-600 dark:text-brand-400")}>
                      {n.title}
                    </p>
                    {!n.read && (
                      <span className="h-1.5 w-1.5 rounded-full bg-brand-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {n.message}
                  </p>
                  <p className="text-[10px] text-slate-400 mt-1">
                    {n.timestamp}
                  </p>
                </div>
              </div>

              {n.tableNumber && (
                <Badge variant="outline" className="font-bold text-[10px] shrink-0">
                  Table {n.tableNumber}
                </Badge>
              )}
            </div>
          ))
        )}
      </div>

      {selectedTableModal && (
        <TableOrderModal
          isOpen={!!selectedTableModal}
          onClose={() => setSelectedTableModal(null)}
          tableId={selectedTableModal.id}
          tableNumber={selectedTableModal.number}
          role="waiter"
        />
      )}
    </div>
  );
}

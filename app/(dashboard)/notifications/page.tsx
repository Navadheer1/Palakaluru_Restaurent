"use client";

import * as React from "react";
import {
  Bell,
  CheckCircle2,
  Receipt,
  ChefHat,
  CreditCard,
  Clock,
  Trash2,
  CheckCheck,
  Filter,
} from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useNotificationStore, WaiterNotification } from "@/stores/useNotificationStore";
import { TableOrderModal } from "@/components/tables/TableOrderModal";
import { useDineInStore } from "@/stores/useDineInStore";
import { cn } from "@/lib/utils";

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, clearAll, getUnreadCount } = useNotificationStore();
  const { sessions } = useDineInStore();

  const [filterType, setFilterType] = React.useState<string>("all");
  const [selectedTableModal, setSelectedTableModal] = React.useState<{ id: string; number: string } | null>(null);

  const unreadCount = getUnreadCount();

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
      // Find table ID in sessions
      const matched = Object.values(sessions).find((s) => s.tableNumber === notif.tableNumber);
      if (matched) {
        setSelectedTableModal({ id: matched.tableId, number: matched.tableNumber });
      }
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center">
              <Bell className="h-6 w-6 mr-2 text-brand-600" />
              Service Notifications & Alerts
            </h1>
            {unreadCount > 0 && (
              <Badge variant="primary" className="bg-emerald-600 text-white animate-pulse">
                {unreadCount} Unread
              </Badge>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Realtime alerts for food readiness, cashier bill generation, and guest payment settlements
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {unreadCount > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={markAllAsRead}
              className="text-xs font-bold space-x-1.5"
            >
              <CheckCheck className="h-3.5 w-3.5 text-slate-500" />
              <span>Mark All Read</span>
            </Button>
          )}
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 space-x-1.5"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Clear Feed</span>
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
          { id: "bill", label: "Bills & Payments" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setFilterType(tab.id)}
            className={cn(
              "px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all",
              filterType === tab.id
                ? "bg-brand-600 text-white shadow-xs"
                : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notification List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-400 border border-dashed rounded-2xl bg-white dark:bg-slate-900">
            <Bell className="h-10 w-10 mx-auto mb-2 text-slate-300" />
            <p className="font-semibold text-slate-700 dark:text-slate-200 text-sm">No notifications to display</p>
            <p className="text-xs text-slate-400 mt-1">
              You are all caught up! Live alerts will appear here during restaurant service.
            </p>
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              onClick={() => markAsRead(item.id)}
              className={cn(
                "p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs",
                item.read
                  ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-80"
                  : "bg-emerald-50/20 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800 ring-1 ring-emerald-400/20"
              )}
            >
              <div className="flex items-start space-x-3.5">
                <div className="h-10 w-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(item.type)}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {item.title}
                    </h3>
                    {!item.read && (
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                    )}
                    {item.tableNumber && (
                      <Badge variant="primary" className="text-[10px] font-bold">
                        Table {item.tableNumber}
                      </Badge>
                    )}
                    {item.kotNumber && (
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {item.kotNumber}
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                    {item.message}
                  </p>
                  <div className="flex items-center space-x-2 text-[11px] text-slate-400 mt-1.5">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                  </div>
                </div>
              </div>

              {item.tableNumber && (
                <div className="flex items-center justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenTable(item);
                    }}
                    className="text-xs font-bold"
                  >
                    Open Table
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Table Order Modal */}
      {selectedTableModal && (
        <TableOrderModal
          isOpen={!!selectedTableModal}
          onClose={() => setSelectedTableModal(null)}
          tableId={selectedTableModal.id}
          tableNumber={selectedTableModal.number}
        />
      )}
    </div>
  );
}

"use client";

import * as React from "react";
import { Bell, ChefHat, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: "order" | "kitchen" | "stock" | "delivery";
  read: boolean;
}

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    title: "Table 04 - Food Ready",
    message: "Special Dum Chicken Biryani is plated and ready for serving",
    time: "2 mins ago",
    type: "kitchen",
    read: false,
  },
  {
    id: "2",
    title: "Low Stock Alert",
    message: "Pure Desi Ghee is below threshold (8.5L remaining)",
    time: "15 mins ago",
    type: "stock",
    read: false,
  },
  {
    id: "3",
    title: "New Takeaway Order #1042",
    message: "2 items received via online portal",
    time: "24 mins ago",
    type: "order",
    read: true,
  },
];

export function NotificationMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [notifications, setNotifications] = React.useState(initialNotifications);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-900 transition-colors"
        title="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white ring-2 ring-white dark:ring-slate-950 animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl border border-slate-200 bg-white p-2 shadow-xl dark:border-slate-800 dark:bg-slate-900 z-50 animate-in fade-in-0 zoom-in-95 duration-150">
          <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 dark:border-slate-800">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-200">
              Live Notifications ({unreadCount} new)
            </span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-medium text-brand-600 hover:underline dark:text-brand-400"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-72 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 my-1">
            {notifications.map((item) => {
              const Icon =
                item.type === "kitchen"
                  ? ChefHat
                  : item.type === "stock"
                  ? AlertTriangle
                  : CheckCircle2;

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start space-x-3 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg",
                    !item.read && "bg-brand-50/40 dark:bg-brand-950/20"
                  )}
                >
                  <div
                    className={cn(
                      "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                      item.type === "kitchen" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                      item.type === "stock" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                      item.type === "order" && "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300"
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-slate-100 truncate">
                      {item.title}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">
                      {item.message}
                    </p>
                    <span className="flex items-center text-[10px] text-slate-400 mt-1">
                      <Clock className="h-3 w-3 mr-1" />
                      {item.time}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-3 py-1.5 border-t border-slate-100 dark:border-slate-800 text-center">
            <span className="text-[11px] text-slate-400">
              Supabase Realtime Feed Active
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

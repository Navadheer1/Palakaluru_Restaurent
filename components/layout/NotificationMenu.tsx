"use client";

import * as React from "react";
import { Bell, ChefHat, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

import { useNotificationStore, WaiterNotification } from "@/stores/useNotificationStore";

export function NotificationMenu() {
  const [isOpen, setIsOpen] = React.useState(false);
  const [mounted, setMounted] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  const { notifications, markAsRead, markAllAsRead, getUnreadCount } = useNotificationStore();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const unreadCount = mounted ? getUnreadCount() : 0;

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const formatTime = (ts: string) => {
    try {
      const d = new Date(ts);
      const diffMs = Date.now() - d.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "Just now";
      if (diffMins < 60) return `${diffMins}m ago`;
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "Recently";
    }
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
              Live Notifications {unreadCount > 0 ? `(${unreadCount} new)` : ""}
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
            {notifications.length === 0 ? (
              <div className="py-8 px-4 text-center text-slate-400">
                <Bell className="h-7 w-7 mx-auto mb-1.5 opacity-30 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">No new notifications</p>
                <p className="text-[11px] text-slate-400 mt-0.5">You are all caught up!</p>
              </div>
            ) : (
              notifications.map((item) => {
                const Icon =
                  item.type === "kot_ready" || item.type === "kot_preparing"
                    ? ChefHat
                    : item.type === "bill_ready" || item.type === "bill_requested"
                    ? AlertTriangle
                    : CheckCircle2;

                return (
                  <div
                    key={item.id}
                    onClick={() => markAsRead(item.id)}
                    className={cn(
                      "flex items-start space-x-3 p-3 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 rounded-lg cursor-pointer",
                      !item.read && "bg-brand-50/40 dark:bg-brand-950/20"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg mt-0.5",
                        item.type === "kot_ready" && "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
                        item.type === "kot_preparing" && "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
                        (item.type === "bill_ready" || item.type === "bill_requested") && "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
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
                        {formatTime(item.timestamp)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
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

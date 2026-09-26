"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Grid,
  Receipt,
  ChefHat,
  Bell,
  UtensilsCrossed,
  CheckCircle2,
  ChevronLeft,
  Flame,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/useUiStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";
import { useNotificationStore } from "@/stores/useNotificationStore";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

export function WaiterSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileNavOpen, setMobileNavOpen } = useUiStore();
  const { profile } = useAuthProfile();
  const unreadCount = useNotificationStore((s) => s.getUnreadCount());

  const userName = profile?.full_name || profile?.name || (profile?.email ? profile.email.split("@")[0] : "Floor Waiter");
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const waiterNavItems: NavItem[] = [
    { name: "Waiter Dashboard", href: "/waiter/dashboard", icon: Grid },
    { name: "My Tables", href: "/waiter/tables", icon: UtensilsCrossed },
    { name: "My Orders", href: "/waiter/orders", icon: Receipt },
    { name: "KOT Status", href: "/waiter/kot", icon: ChefHat, badge: "Live" },
    { name: "Ready Orders", href: "/waiter/ready-orders", icon: CheckCircle2 },
    { name: "Bill Requests", href: "/waiter/bill-requests", icon: Receipt },
    {
      name: "Notifications",
      href: "/waiter/notifications",
      icon: Bell,
      badge: mounted && unreadCount > 0 ? unreadCount : undefined,
    },
  ];

  return (
    <>
      {isMobileNavOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setMobileNavOpen(false)}
        />
      )}

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200/80 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-950",
          isSidebarCollapsed ? "w-20" : "w-64",
          isMobileNavOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        <div
          className={cn(
            "relative flex h-16 items-center border-b border-slate-100 dark:border-slate-800/80 transition-all duration-300",
            isSidebarCollapsed ? "justify-center px-2" : "justify-between px-4"
          )}
        >
          <Link href="/waiter/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white shadow-md shadow-emerald-500/20">
              <Flame className="h-6 w-6" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  Palakaluru RMS
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 tracking-wider uppercase">
                  Waiter Portal
                </span>
              </div>
            )}
          </Link>

          {!isSidebarCollapsed && (
            <button
              onClick={toggleSidebar}
              className="hidden lg:flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {!isSidebarCollapsed && (
            <h4 className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              FLOOR SERVICE
            </h4>
          )}
          {waiterNavItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;

            return (
              <Link
                key={item.name}
                href={item.href}
                prefetch={true}
                onClick={() => setMobileNavOpen(false)}
                className={cn(
                  "group relative flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150",
                  isActive
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-200",
                  isSidebarCollapsed && "justify-center px-0 py-3"
                )}
                title={isSidebarCollapsed ? item.name : undefined}
              >
                <Icon className={cn("h-4 w-4 shrink-0", !isSidebarCollapsed && "mr-3")} />
                {!isSidebarCollapsed && (
                  <span className="flex-1 truncate">{item.name}</span>
                )}
                {!isSidebarCollapsed && item.badge && (
                  <span
                    suppressHydrationWarning
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                    )}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>

        <div className="border-t border-slate-100 p-3 dark:border-slate-800/80">
          <div
            className={cn(
              "flex items-center rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900 border border-slate-200/60 dark:border-slate-800/60",
              isSidebarCollapsed ? "justify-center" : "space-x-3"
            )}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs">
              WT
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {userName}
                </span>
                <span className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wide">
                  TABLE SERVICE
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChefHat,
  Flame,
  CheckCircle2,
  Clock,
  Receipt,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/stores/useUiStore";
import { useAuthProfile } from "@/lib/hooks/useAuthProfile";

interface NavItem {
  name: string;
  href: string;
  icon: React.ElementType;
  badge?: string | number;
}

export function KitchenSidebar() {
  const pathname = usePathname();
  const { isSidebarCollapsed, toggleSidebar, isMobileNavOpen, setMobileNavOpen } = useUiStore();
  const { profile } = useAuthProfile();

  const userName = profile?.full_name || profile?.name || "Kitchen Chef";

  const kitchenNavItems: NavItem[] = [
    { name: "Kitchen Display (KDS)", href: "/kitchen/dashboard", icon: ChefHat, badge: "Live" },
    { name: "Incoming KOT Queue", href: "/kitchen/kot", icon: Flame },
    { name: "Order History", href: "/kitchen/orders", icon: Receipt },
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
          <Link href="/kitchen/dashboard" className="flex items-center space-x-3 overflow-hidden">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-md shadow-amber-500/20">
              <ChefHat className="h-6 w-6" />
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col whitespace-nowrap overflow-hidden">
                <span className="font-bold text-base tracking-tight text-slate-900 dark:text-white leading-tight">
                  Palakaluru RMS
                </span>
                <span className="text-[10px] font-semibold text-amber-600 tracking-wider uppercase">
                  Kitchen Display
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
              KITCHEN STATIONS
            </h4>
          )}
          {kitchenNavItems.map((item) => {
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
                    ? "bg-amber-600 text-white shadow-sm"
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
                    className={cn(
                      "ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold",
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-amber-50 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
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
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300 font-bold text-xs">
              KC
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate">
                  {userName}
                </span>
                <span className="text-[10px] text-amber-600 font-semibold uppercase tracking-wide">
                  CHEF STATION
                </span>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
